from datetime import datetime, timedelta
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.auth import verify_password, create_access_token
from app.dependencies import get_current_user, require_role
from app.models import User, Category, MenuItem, Deal, DealItem, Order, OrderItem, TableSale, Setting
from app.schemas import (
    UserLogin, UserCreate, UserOut, Token,
    CategoryCreate, CategoryOut,
    MenuItemCreate, MenuItemUpdate, MenuItemOut,
    DealCreate, DealUpdate, DealOut,
    OrderCreate, OrderUpdate, OrderOut,
    TableSaleCreate, TableSaleOut,
    SettingItem, SettingsOut, Message,
)
from app.utils import get_setting, get_decimal_setting
import os

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])
user_router = APIRouter(prefix="/api/users", tags=["users"])
category_router = APIRouter(prefix="/api/categories", tags=["categories"])
menu_router = APIRouter(prefix="/api/menu-items", tags=["menu"])
deal_router = APIRouter(prefix="/api/deals", tags=["deals"])
order_router = APIRouter(prefix="/api/orders", tags=["orders"])
table_router = APIRouter(prefix="/api/table-sales", tags=["tables"])
report_router = APIRouter(prefix="/api/reports", tags=["reports"])
setting_router = APIRouter(prefix="/api/settings", tags=["settings"])


# ---------- Auth ----------
@auth_router.post("/login", response_model=Token)
def login(body: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer", "user": user}


@auth_router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------- Users ----------
@user_router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    return db.query(User).all()


@user_router.post("", response_model=UserOut)
def create_user(body: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    from app.auth import get_password_hash
    user = User(**body.model_dump(exclude={"password"}), hashed_password=get_password_hash(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@user_router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in body.model_dump(exclude={"password"}).items():
        setattr(user, key, value)
    if body.password:
        from app.auth import get_password_hash
        user.hashed_password = get_password_hash(body.password)
    db.commit()
    db.refresh(user)
    return user


@user_router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ---------- Categories ----------
@category_router.get("", response_model=list[CategoryOut])
def list_categories(section: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Category)
    if section:
        q = q.filter(Category.section.ilike(section))
    return q.order_by(Category.sort_order, Category.id).all()


@category_router.post("", response_model=CategoryOut)
def create_category(body: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    cat = Category(**body.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@category_router.put("/{cat_id}", response_model=CategoryOut)
def update_category(cat_id: int, body: CategoryCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for k, v in body.model_dump().items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@category_router.delete("/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    cat = db.query(Category).filter(Category.id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(cat)
    db.commit()
    return {"message": "Category deleted"}


# ---------- Menu Items ----------
@menu_router.get("", response_model=list[MenuItemOut])
def list_menu_items(category_id: Optional[int] = None, q: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(MenuItem).join(Category)
    if not current_user.role == "admin":
        query = query.filter(MenuItem.is_active == True)
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    if q:
        query = query.filter(MenuItem.name.ilike(f"%{q}%"))
    return query.order_by(MenuItem.name).all()


@menu_router.post("", response_model=MenuItemOut)
def create_menu_item(body: MenuItemCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    item = MenuItem(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@menu_router.get("/{item_id}", response_model=MenuItemOut)
def get_menu_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@menu_router.put("/{item_id}", response_model=MenuItemOut)
def update_menu_item(item_id: int, body: MenuItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@menu_router.delete("/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}


# ---------- Deals ----------
@deal_router.get("", response_model=list[DealOut])
def list_deals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Deal).filter(Deal.is_active == True).all()


@deal_router.post("", response_model=DealOut)
def create_deal(body: DealCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    deal = Deal(name=body.name, price=body.price, description=body.description, is_active=body.is_active)
    db.add(deal)
    db.flush()
    for di in body.items:
        db.add(DealItem(deal_id=deal.id, menu_item_id=di.menu_item_id, quantity=di.quantity))
    db.commit()
    db.refresh(deal)
    return deal


@deal_router.get("/{deal_id}", response_model=DealOut)
def get_deal(deal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@deal_router.put("/{deal_id}", response_model=DealOut)
def update_deal(deal_id: int, body: DealUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for k, v in body.model_dump(exclude_unset=True, exclude={"items"}).items():
        setattr(deal, k, v)
    if body.items is not None:
        db.query(DealItem).filter(DealItem.deal_id == deal_id).delete()
        for di in body.items:
            db.add(DealItem(deal_id=deal.id, menu_item_id=di.menu_item_id, quantity=di.quantity))
    db.commit()
    db.refresh(deal)
    return deal


@deal_router.delete("/{deal_id}")
def delete_deal(deal_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role("admin"))):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"message": "Deal deleted"}


# ---------- Helpers ----------
def _get_period_range(period: str, start: Optional[str] = None, end: Optional[str] = None):
    now = datetime.utcnow()
    if start and end:
        try:
            s = datetime.fromisoformat(start)
            e = datetime.fromisoformat(end)
            return s, e
        except Exception:
            pass
    if period == "today":
        s = now.replace(hour=0, minute=0, second=0, microsecond=0)
        e = now
    elif period == "week":
        s = now - timedelta(days=7)
        e = now
    elif period == "month":
        s = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        e = now
    else:
        s = now.replace(hour=0, minute=0, second=0, microsecond=0)
        e = now
    return s, e


def _compute_order_totals(db: Session, order: Order):
    subtotal = Decimal("0")
    for line in order.order_items:
        line.total_price = line.unit_price * line.quantity
        subtotal += line.total_price
    tax_rate = get_decimal_setting(db, "tax_rate", Decimal("0"))
    order.subtotal = subtotal
    order.tax = (subtotal * tax_rate / 100).quantize(Decimal("0.01"))
    order.total = (subtotal - order.discount + order.tax).quantize(Decimal("0.01"))
    if order.total < 0:
        order.total = Decimal("0")


# ---------- Orders ----------
@order_router.get("", response_model=list[OrderOut])
def list_orders(status: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    q = db.query(Order)
    if status:
        q = q.filter(Order.status == status)
    return q.order_by(Order.created_at.desc()).all()


@order_router.post("", response_model=OrderOut)
def create_order(body: OrderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = Order(
        order_type=body.order_type,
        table_number=body.table_number,
        payment_method=body.payment_method,
        notes=body.notes,
        discount=body.discount,
        user_id=current_user.id,
    )
    db.add(order)
    db.flush()
    for line in body.items:
        if line.deal_id:
            deal = db.query(Deal).filter(Deal.id == line.deal_id).first()
            if not deal:
                raise HTTPException(status_code=404, detail="Deal not found")
            order.order_items.append(
                OrderItem(
                    deal_id=deal.id,
                    quantity=line.quantity,
                    unit_price=deal.price,
                    total_price=deal.price * line.quantity,
                    notes=line.notes,
                )
            )
        elif line.menu_item_id:
            item = db.query(MenuItem).filter(MenuItem.id == line.menu_item_id).first()
            if not item:
                raise HTTPException(status_code=404, detail="Menu item not found")
            order.order_items.append(
                OrderItem(
                    menu_item_id=item.id,
                    quantity=line.quantity,
                    unit_price=item.price,
                    total_price=item.price * line.quantity,
                    notes=line.notes,
                )
            )
    _compute_order_totals(db, order)
    db.commit()
    db.refresh(order)
    return order


@order_router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@order_router.put("/{order_id}", response_model=OrderOut)
def update_order(order_id: int, body: OrderUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "closed":
        raise HTTPException(status_code=400, detail="Closed order cannot be edited")
    if body.order_type is not None:
        order.order_type = body.order_type
    if body.table_number is not None:
        order.table_number = body.table_number
    if body.payment_method is not None:
        order.payment_method = body.payment_method
    if body.notes is not None:
        order.notes = body.notes
    if body.discount is not None:
        order.discount = body.discount
    if body.status is not None:
        order.status = body.status
    if body.items is not None:
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
        for line in body.items:
            if line.deal_id:
                deal = db.query(Deal).filter(Deal.id == line.deal_id).first()
                if not deal:
                    raise HTTPException(status_code=404, detail="Deal not found")
                order.order_items.append(
                    OrderItem(
                        deal_id=deal.id,
                        quantity=line.quantity,
                        unit_price=deal.price,
                        total_price=deal.price * line.quantity,
                        notes=line.notes,
                    )
                )
            elif line.menu_item_id:
                item = db.query(MenuItem).filter(MenuItem.id == line.menu_item_id).first()
                if not item:
                    raise HTTPException(status_code=404, detail="Menu item not found")
                order.order_items.append(
                    OrderItem(
                        menu_item_id=item.id,
                        quantity=line.quantity,
                        unit_price=item.price,
                        total_price=item.price * line.quantity,
                        notes=line.notes,
                    )
                )
    _compute_order_totals(db, order)
    db.commit()
    db.refresh(order)
    return order


@order_router.post("/{order_id}/close", response_model=OrderOut)
def close_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "closed"
    order.closed_at = datetime.utcnow()
    _compute_order_totals(db, order)
    db.commit()
    db.refresh(order)
    return order


@order_router.delete("/{order_id}")
def cancel_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "cancelled"
    db.commit()
    return {"message": "Order cancelled"}


# ---------- Tables ----------
@table_router.get("", response_model=list[TableSaleOut])
def list_table_sales(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TableSale).order_by(TableSale.created_at.desc()).all()


@table_router.post("", response_model=TableSaleOut)
def create_table_sale(body: TableSaleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ts = TableSale(**body.model_dump())
    db.add(ts)
    db.commit()
    db.refresh(ts)
    return ts


@table_router.put("/{sale_id}", response_model=TableSaleOut)
def update_table_sale(sale_id: int, body: TableSaleCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ts = db.query(TableSale).filter(TableSale.id == sale_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Table sale not found")
    for k, v in body.model_dump().items():
        setattr(ts, k, v)
    db.commit()
    db.refresh(ts)
    return ts


@table_router.post("/{sale_id}/close", response_model=TableSaleOut)
def close_table_sale(sale_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ts = db.query(TableSale).filter(TableSale.id == sale_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Table sale not found")
    ts.status = "closed"
    ts.closed_at = datetime.utcnow()
    db.commit()
    db.refresh(ts)
    return ts


# ---------- Reports ----------
@report_router.get("/summary")
def summary_report(period: str = "today", start: Optional[str] = None, end: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s, e = _get_period_range(period, start, end)
    orders = db.query(Order).filter(Order.status == "closed", Order.closed_at >= s, Order.closed_at <= e).all()
    order_count = len(orders)
    revenue = sum((o.total for o in orders), Decimal("0"))
    total_items = db.query(func.coalesce(func.sum(OrderItem.quantity), 0)).filter(
        OrderItem.order_id.in_([o.id for o in orders])
    ).scalar()

    # Most / least sold item
    item_rows = db.query(
        func.coalesce(MenuItem.name, Deal.name).label("name"),
        func.sum(OrderItem.quantity).label("qty"),
    ).join(Order, OrderItem.order_id == Order.id).outerjoin(MenuItem, OrderItem.menu_item_id == MenuItem.id).outerjoin(Deal, OrderItem.deal_id == Deal.id).filter(
        Order.status == "closed", Order.closed_at >= s, Order.closed_at <= e
    ).group_by(func.coalesce(MenuItem.name, Deal.name)).all()

    most = None
    least = None
    if item_rows:
        most = max(item_rows, key=lambda x: x.qty or 0).name
        least = min(item_rows, key=lambda x: x.qty or 0).name

    # Category sales (menu items only; deals excluded from category)
    cat_rows = db.query(
        Category.name,
        func.sum(OrderItem.quantity).label("qty"),
        func.sum(OrderItem.total_price).label("total"),
    ).join(MenuItem, OrderItem.menu_item_id == MenuItem.id).join(Category, MenuItem.category_id == Category.id).join(Order, OrderItem.order_id == Order.id).filter(
        Order.status == "closed", Order.closed_at >= s, Order.closed_at <= e
    ).group_by(Category.name).all()

    category_sales = [{"category": r.name, "quantity": int(r.qty or 0), "revenue": float(r.total or 0)} for r in cat_rows]

    return {
        "period": period,
        "start_date": s.isoformat(),
        "end_date": e.isoformat(),
        "order_count": order_count,
        "total_revenue": float(revenue),
        "total_items": int(total_items or 0),
        "most_sold": most,
        "least_sold": least,
        "category_sales": category_sales,
    }


@report_router.get("/items")
def item_report(period: str = "today", start: Optional[str] = None, end: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    s, e = _get_period_range(period, start, end)
    rows = db.query(
        func.coalesce(MenuItem.name, Deal.name).label("name"),
        func.sum(OrderItem.quantity).label("qty"),
        func.sum(OrderItem.total_price).label("total"),
    ).join(Order, OrderItem.order_id == Order.id).outerjoin(MenuItem, OrderItem.menu_item_id == MenuItem.id).outerjoin(Deal, OrderItem.deal_id == Deal.id).filter(
        Order.status == "closed", Order.closed_at >= s, Order.closed_at <= e
    ).group_by(func.coalesce(MenuItem.name, Deal.name)).order_by(func.sum(OrderItem.total_price).desc()).all()

    return {
        "start_date": s.isoformat(),
        "end_date": e.isoformat(),
        "items": [{"name": r.name, "quantity": int(r.qty or 0), "revenue": float(r.total or 0)} for r in rows],
    }


# ---------- Settings ----------
@setting_router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    rows = db.query(Setting).all()
    return {"values": {r.key: r.value for r in rows}}


@setting_router.put("", response_model=SettingsOut)
def update_settings(body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for key, value in body.items():
        row = db.query(Setting).filter(Setting.key == key).first()
        if row:
            row.value = value
        else:
            db.add(Setting(key=key, value=value))
    db.commit()
    return get_settings(db, current_user)


@setting_router.get("/backup")
def backup_db(current_user: User = Depends(get_current_user)):
    # path from sqlite url: sqlite:///./pos_al_ghani.db
    db_path = os.path.abspath("./pos_al_ghani.db")
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database file not found")
    return FileResponse(db_path, media_type="application/octet-stream", filename="pos_al_ghani_backup.db")


def create_routers():
    return [
        auth_router,
        user_router,
        category_router,
        menu_router,
        deal_router,
        order_router,
        table_router,
        report_router,
        setting_router,
    ]

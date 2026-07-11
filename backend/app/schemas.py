from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class UserLogin(BaseModel):
    username: str
    password: str


class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    role: str = "cashier"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class CategoryBase(BaseModel):
    name: str
    section: str
    sort_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryOut(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class MenuItemBase(BaseModel):
    name: str
    price: Decimal
    category_id: int
    is_active: bool = True


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[Decimal] = None
    category_id: Optional[int] = None
    is_active: Optional[bool] = None


class MenuItemOut(MenuItemBase):
    id: int
    created_at: datetime
    category: Optional[CategoryOut] = None
    model_config = ConfigDict(from_attributes=True)


class DealItemBase(BaseModel):
    menu_item_id: int
    quantity: int = 1


class DealItemOut(DealItemBase):
    id: int
    menu_item: Optional[MenuItemOut] = None
    model_config = ConfigDict(from_attributes=True)


class DealBase(BaseModel):
    name: str
    price: Decimal
    description: Optional[str] = None
    is_active: bool = True


class DealCreate(DealBase):
    items: List[DealItemBase]


class DealUpdate(DealBase):
    items: Optional[List[DealItemBase]] = None


class DealOut(DealBase):
    id: int
    created_at: datetime
    deal_items: List[DealItemOut] = []
    model_config = ConfigDict(from_attributes=True)


class OrderItemIn(BaseModel):
    menu_item_id: Optional[int] = None
    deal_id: Optional[int] = None
    quantity: int = 1
    notes: Optional[str] = None


class OrderItemOut(BaseModel):
    id: int
    menu_item_id: Optional[int]
    deal_id: Optional[int]
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    notes: Optional[str]
    menu_item: Optional[MenuItemOut] = None
    deal: Optional[DealOut] = None
    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    order_type: str = "dine_in"
    table_number: Optional[int] = None
    payment_method: str = "cash"
    notes: Optional[str] = None
    subtotal: Decimal = Decimal("0")
    tax: Decimal = Decimal("0")
    discount: Decimal = Decimal("0")
    total: Decimal = Decimal("0")


class OrderCreate(OrderBase):
    items: List[OrderItemIn]


class OrderUpdate(BaseModel):
    order_type: Optional[str] = None
    table_number: Optional[int] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    items: Optional[List[OrderItemIn]] = None


class OrderOut(OrderBase):
    id: int
    status: str
    created_at: datetime
    closed_at: Optional[datetime] = None
    user_id: Optional[int] = None
    user: Optional[UserOut] = None
    order_items: List[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)


class TableSaleBase(BaseModel):
    table_number: int
    bill_amount: Decimal
    payment_method: str = "cash"
    notes: Optional[str] = None


class TableSaleCreate(TableSaleBase):
    pass


class TableSaleOut(TableSaleBase):
    id: int
    status: str
    created_at: datetime
    closed_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class SettingItem(BaseModel):
    key: str
    value: Optional[str] = None


class SettingsOut(BaseModel):
    values: dict


class ReportSummary(BaseModel):
    total_revenue: Decimal
    order_count: int
    total_items: int
    most_sold: Optional[str]
    least_sold: Optional[str]
    category_sales: List[dict]
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class Message(BaseModel):
    message: str

from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="cashier")  # admin, manager, cashier
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    section = Column(String, nullable=False)  # BBQ, Fast Food, Sides, etc.
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    menu_items = relationship("MenuItem", back_populates="category")


class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category = relationship("Category", back_populates="menu_items")


class Deal(Base):
    __tablename__ = "deals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    deal_items = relationship("DealItem", back_populates="deal")


class DealItem(Base):
    __tablename__ = "deal_items"
    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=False)
    quantity = Column(Integer, default=1)

    deal = relationship("Deal", back_populates="deal_items")
    menu_item = relationship("MenuItem")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    order_type = Column(String, default="dine_in")  # dine_in, takeaway, delivery
    table_number = Column(Integer, nullable=True)
    status = Column(String, default="open")  # open, closed, cancelled
    payment_method = Column(String, default="cash")
    notes = Column(Text, nullable=True)
    subtotal = Column(Numeric(10, 2), default=0)
    tax = Column(Numeric(10, 2), default=0)
    discount = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=True)
    quantity = Column(Integer, default=1)
    unit_price = Column(Numeric(10, 2), default=0)
    total_price = Column(Numeric(10, 2), default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="order_items")
    menu_item = relationship("MenuItem")
    deal = relationship("Deal")


class TableSale(Base):
    __tablename__ = "table_sales"
    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(Integer, nullable=False)
    bill_amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(String, default="cash")
    notes = Column(Text, nullable=True)
    status = Column(String, default="open")  # open, closed
    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)


class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

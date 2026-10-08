const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1"
]);


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());


// =====================================================
// DATABASE CONNECTION
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("=================================");
    console.log("MongoDB Connected Successfully");
    console.log("=================================");
  })
  .catch((error) => {
    console.log("MongoDB Connection Failed");
    console.log(error.message);
  });


// =====================================================
// PRODUCT MODEL
// =====================================================

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    available: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Product = mongoose.model("Product", productSchema);


// =====================================================
// ORDER ITEM SCHEMA
// =====================================================

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },

    name: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    subtotal: {
      type: Number,
      required: true
    }
  },
  {
    _id: false
  }
);


// =====================================================
// ORDER MODEL
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true
    },

    items: {
      type: [orderItemSchema],
      default: []
    },

    total: {
      type: Number,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);


// =====================================================
// BASIC TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Khao Piyo Fuko API is running"
  });
});


// =====================================================
// PRODUCT ROUTES
// =====================================================


// GET ALL PRODUCTS

app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({
      category: 1,
      name: 1
    });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message
    });
  }
});


// ADD PRODUCT

app.post("/api/products", async (req, res) => {
  try {
    const {
      name,
      category,
      price
    } = req.body;

    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, category and price are required"
      });
    }

    const product = await Product.create({
      name: name.trim(),
      category: category.trim(),
      price: Number(price)
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message
    });
  }
});


// UPDATE PRODUCT

app.put("/api/products/:id", async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      available
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name?.trim(),
        category: category?.trim(),
        price: Number(price),
        available
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message
    });
  }
});


// DELETE PRODUCT

app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(
      req.params.id
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message
    });
  }
});


// =====================================================
// ORDER ROUTES
// =====================================================


// GET ACTIVE ORDERS

app.get("/api/orders/active", async (req, res) => {
  try {
    const orders = await Order.find({
      status: "active"
    }).sort({
      createdAt: 1
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active orders",
      error: error.message
    });
  }
});


// GET COMPLETED ORDER HISTORY

app.get("/api/orders/history", async (req, res) => {
  try {
    const orders = await Order.find({
      status: "completed"
    }).sort({
      createdAt: -1
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order history",
      error: error.message
    });
  }
});


// CREATE NEW CUSTOMER ORDER

app.post("/api/orders", async (req, res) => {
  try {
    const {
      customerName
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required"
      });
    }

    const order = await Order.create({
      customerName: customerName.trim(),

      items: [],

      total: 0,

      status: "active"
    });

    res.status(201).json({
      success: true,
      message: "New order created successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message
    });
  }
});


// UPDATE ORDER

app.put("/api/orders/:id", async (req, res) => {
  try {
    const {
      customerName,
      items,
      total,
      status
    } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        customerName,
        items,
        total,
        status
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message
    });
  }
});


// COMPLETE ORDER

app.patch(
  "/api/orders/:id/complete",
  async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,

        {
          status: "completed"
        },

        {
          new: true
        }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found"
        });
      }

      res.status(200).json({
        success: true,
        message: "Order completed successfully",
        data: order
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to complete order",
        error: error.message
      });
    }
  }
);


// =====================================================
// DELETE ACTIVE ORDER
// =====================================================

app.delete("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message
    });
  }
});


// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log("   KHAO PIYO FUKO CAFE SYSTEM");
  console.log("=================================");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("=================================");
  console.log("");
});
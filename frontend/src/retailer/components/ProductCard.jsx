// frontend/src/retailer/components/ProductCard.jsx
import React from "react";
import { Card, Button } from "react-bootstrap";
import noImage from "../assets/no-image.png";

export default function ProductCard({ product, onAddToCart }) {
  const imageSrc =
    product.image && product.image.trim() !== "" ? product.image : noImage;

  return (
    <Card className="h-100 shadow-sm">
      {/* Product Image */}
      <div className="text-center p-3">
        <Card.Img
          variant="top"
          src={imageSrc}
          alt={product.name}
          style={{
            height: "70px",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Product Info */}
      <Card.Body className="d-flex flex-column">
        <Card.Title className="text-truncate">{product.name}</Card.Title>
        <Card.Text className="mb-2 text-muted small">
          {product.category || "General"}
        </Card.Text>
        
        <div className="flex d-flex justify-content-between mb-2">
          <h6 className="fw-bold text-success">
          ₹{Number(product.price).toFixed(2)}
        </h6>

        {product.quantity !== undefined && (
          <Card.Text className="text-muted small">
            Stock: {product.quantity}
          </Card.Text>
        )}
        </div>

        

        {/* Add to Cart Button */}
        <Button
          variant="primary"
          className="mt-auto"
          onClick={() => onAddToCart(product)}
        >
          🛒 Add to Cart
        </Button>
      </Card.Body>
    </Card>
  );
}

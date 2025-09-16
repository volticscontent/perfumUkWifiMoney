import React from 'react';
import styles from '../styles/Perfumes.module.css';

interface Product {
  type: string;
  combo_name: string;
  path: string;
  item_number?: number;
}

interface ProductGridProps {
  products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  return (
    <section className={styles.productGrid}>
      {products.map((product, index) => (
        <div key={index} className={styles.productCard}>
          <div className={styles.productImage}>
            <img src={`/images/products/${product.path}`} alt={product.combo_name} />
          </div>
          <h3 className={styles.productName}>{product.combo_name}</h3>
          {/* We don't have price data in the json, so we'll use a placeholder */}
          <p className={styles.productPrice}>£50</p>
          <button className={styles.productButton}>Add to Basket</button>
        </div>
      ))}
    </section>
  );
};

export default ProductGrid;
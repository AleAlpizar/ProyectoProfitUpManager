// components/ProductCard.tsx

interface ProductCardProps {
  name: string;
  price: number;
  stock: number;
  imageUrl: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ name, price, stock, imageUrl }) => {
  return (
    <div className="max-w-xs bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="relative w-full h-48">
        <img
          src={imageUrl}
          alt={name}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 300px"
        />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 truncate">{name}</h2>
        <p className="text-gray-600 mt-1">Precio: <span className="font-bold text-green-600">${price.toFixed(2)}</span></p>
        <p className={`mt-1 ${stock > 0 ? "text-blue-600" : "text-red-500"} font-medium`}>
          {stock > 0 ? `Stock: ${stock}` : "Agotado"}
        </p>
      </div>
    </div>
  );
};

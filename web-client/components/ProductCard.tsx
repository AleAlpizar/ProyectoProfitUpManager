export function ProductCard({ name, price, stock, imageUrl }:{
  name:string; price:number; stock:number; imageUrl:string;
}) {
  return (
    <div className="max-w-xs bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="relative w-full h-48">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 truncate" title={name}>{name}</h2>
        <p className="text-gray-600 mt-1">Precio: <span className="font-bold text-green-600">${price.toFixed(2)}</span></p>
        <p className={`mt-1 ${stock > 0 ? "text-blue-600" : "text-red-500"} font-medium`}>
          {stock > 0 ? `Stock: ${stock}` : "Agotado"}
        </p>
      </div>
    </div>
  );
}

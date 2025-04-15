
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface NutritionalInfo {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  fiber: number;
  sodium: number;
}

interface NutritionalTableProps {
  nutritionalInfo: NutritionalInfo;
}

export function NutritionalTable({ nutritionalInfo }: NutritionalTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50"
      >
        <span className="font-medium">Informação Nutricional</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Calorias</p>
              <p className="font-medium">{nutritionalInfo.calories} kcal</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Proteínas</p>
              <p className="font-medium">{nutritionalInfo.proteins}g</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Carboidratos</p>
              <p className="font-medium">{nutritionalInfo.carbs}g</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gorduras</p>
              <p className="font-medium">{nutritionalInfo.fats}g</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fibras</p>
              <p className="font-medium">{nutritionalInfo.fiber}g</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sódio</p>
              <p className="font-medium">{nutritionalInfo.sodium}mg</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

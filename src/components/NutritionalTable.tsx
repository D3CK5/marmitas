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
        className="w-full px-3 sm:px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-sm sm:text-base">Informação Nutricional</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-2">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Calorias</p>
              <p className="font-semibold text-sm sm:text-base">{nutritionalInfo.calories} kcal</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Proteínas</p>
              <p className="font-semibold text-sm sm:text-base">{nutritionalInfo.proteins}g</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Carboidratos</p>
              <p className="font-semibold text-sm sm:text-base">{nutritionalInfo.carbs}g</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Gorduras</p>
              <p className="font-semibold text-sm sm:text-base">{nutritionalInfo.fats}g</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Fibras</p>
              <p className="font-semibold text-sm sm:text-base">{nutritionalInfo.fiber}g</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Sódio</p>
              <p className="font-semibold text-sm sm:text-base">{nutritionalInfo.sodium}mg</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

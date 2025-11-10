import { PieceColor, PieceType } from '../types/chess';
import ChessPiece from './ChessPiece';

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
}

export default function PromotionModal({ color, onSelect }: PromotionModalProps) {
  const pieces: PieceType[] = ['Q', 'R', 'B', 'N'];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-center mb-4 text-neutral-800">
          Выберите фигуру для превращения
        </h3>
        <div className="flex gap-4">
          {pieces.map(piece => (
            <button
              key={piece}
              onClick={() => onSelect(piece)}
              className="w-20 h-20 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg transform hover:scale-105 p-2"
            >
              <ChessPiece color={color} type={piece} size={64} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

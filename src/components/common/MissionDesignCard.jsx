import React from "react";
import { Badge } from "flowbite-react"; // Import Badge from Flowbite
import { FaPen } from "react-icons/fa"; // Import the edit icon

const MissionDesignCard = ({ onEdit, subtitle, title }) => {
  return (
    // 1. Main container: Added dark mode classes
    <div className="h-full cursor-pointer relative bg-white border-2 border-transparent hover:border-lime-500 rounded-lg p-4 shadow-md min-h-[150px] flex flex-col items-center dark:bg-gray-800 dark:border-gray-700 dark:hover:border-lime-500">
      {" "}
      {/* Changed default border to transparent, added dark styles */}
      {/* 2. Title: Added dark mode text color */}
      <h5 className="text-lg font-semibold text-gray-900 mb-1 text-center dark:text-white">
        {title}
      </h5>
      {/* 3. Subtitle: Added dark mode text color */}
      <p className="text-sm text-gray-600 text-center dark:text-gray-400">
        {subtitle}
      </p>
      {/* 4. Edit Badge: Positioned absolutely in the bottom-left corner */}
      {/* Added stopPropagation to prevent card click when clicking badge */}
      <div
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering card's potential onClick
          onEdit();
        }}
        className="absolute bottom-2 left-2"
      >
        {/* Flowbite Badge usually adapts to dark mode automatically */}
        <Badge color="success" icon={FaPen} />
      </div>
    </div>
  );
};

export default MissionDesignCard;

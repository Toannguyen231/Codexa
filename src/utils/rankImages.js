/**
 * Utility to map rank types to their corresponding images
 */

const RANK_IMAGE_MAP = {
    'Sắt': '/anhRank/lucid-origin_A_3D_gaming_rank_badge_icon_high-tech_neon_style_dark_cyberpunk_futuristic_aesth-0 (1).jpg',
    'Đồng': '/anhRank/lucid-origin_A_3D_gaming_rank_bronze_icon_high-tech_neon_style_dark_cyberpunk_futuristic_aesth-0 (1).jpg',
    'Bạc': '/anhRank/lucid-origin_A_3D_gaming_rank_silver_icon_high-tech_neon_style_dark_cyberpunk_futuristic_aesth-0 (1).jpg',
    'Vàng': '/anhRank/lucid-origin_A_3D_gaming_rank_gold_icon_high-tech_neon_style_dark_cyberpunk_futuristic_aesth-0 (2).jpg',
    'Tinh Anh': '/anhRank/lucid-origin_A_3D_gaming_rank_platinum_icon_high-tech_neon_style_dark_cyberpunk_futuristic_aesth-0 (2).jpg',
    'Kim Cương': '/anhRank/lucid-origin_A_3D_gaming_rank_diamond_icon_high-tech_neon_style_dark_cyberpunk_futuristic_aesth-0 (2).jpg',
    'Thách Đấu': '/anhRank/lucid-origin_A_3D_gaming_rank_tháchĐấu_icon_high-tech_neon_style_dark_cyberpunk_futuristic_aesth-0 (2).jpg'
};

/**
 * Get the image path for a given rank
 * @param {string} rank - The rank name (e.g., 'Sắt', 'Đồng', 'Bạc', etc.)
 * @returns {string} The image path for the rank
 */
export const getRankImage = (rank) => {
    return RANK_IMAGE_MAP[rank] || RANK_IMAGE_MAP['Sắt']; // Default to Iron rank image
};

/**
 * Get all rank images (for charts or displays)
 * @returns {Object} Map of rank names to image paths
 */
export const getAllRankImages = () => {
    return RANK_IMAGE_MAP;
};

/**
 * Get all rank names in order
 * @returns {Array} Array of rank names in order
 */
export const getRankOrder = () => {
    return ['Sắt', 'Đồng', 'Bạc', 'Vàng', 'Tinh Anh', 'Kim Cương', 'Thách Đấu'];
};

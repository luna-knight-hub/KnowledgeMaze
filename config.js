// config.js — được tạo bởi Map Editor
// Ngày tạo: 00:00:55 24/2/2026

window.GAME_CONFIG = {
  "settings": {
    "title": "Mê cung Tri thức",
    "play_limit_per_day": 3,
    "competition_window": {
      "start": "2026-02-22T08:00:00",
      "end": "2026-12-31T23:59:00"
    }
  },
  "start": { "x": 1, "y": 1 },
  "end": { "x": 7, "y": 7 },
  "maze": [
    [
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
    ],
    [
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1
    ],
    [
      1,
      0,
      1,
      0,
      1,
      0,
      1,
      0,
      1
    ],
    [
      1,
      0,
      1,
      0,
      1,
      0,
      1,
      0,
      1
    ],
    [
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      1
    ],
    [
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1
    ],
    [
      1,
      0,
      1,
      0,
      1,
      0,
      1,
      0,
      1
    ],
    [
      1,
      0,
      0,
      0,
      1,
      0,
      0,
      0,
      1
    ],
    [
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1
    ]
  ],
  "milestones": [
    {
      "x_pct": 20,
      "y_pct": 25,
      "x": 2,
      "y": 2,
      "type": "mcq",
      "question": "CPU là viết tắt của?",
      "options": [
        "Central Processing Unit",
        "Computer Power Unit",
        "Central Power Unit",
        "Computer Processing Unit"
      ],
      "correct": 0,
      "points": 100,
      "time": 20
    },
    {
      "x_pct": 70,
      "y_pct": 25,
      "x": 6,
      "y": 2,
      "type": "fill",
      "question": "RAM là viết tắt của Random Access ___?",
      "correct_answers": [
        "Memory",
        "memory"
      ],
      "points": 100,
      "time": 20
    },
    {
      "x_pct": 70,
      "y_pct": 75,
      "x": 6,
      "y": 6,
      "type": "matching",
      "question": "Nối đúng thiết bị với chức năng:",
      "pairs": [
        {
          "left": "Chuột",
          "right": "Thiết bị nhập"
        },
        {
          "left": "Màn hình",
          "right": "Thiết bị xuất"
        },
        {
          "left": "CPU",
          "right": "Xử lý"
        }
      ],
      "points": 150,
      "time": 30
    },
    {
      "x_pct": 20,
      "y_pct": 75,
      "x": 2,
      "y": 6,
      "type": "mcq",
      "question": "Đơn vị nào nhỏ nhất của dữ liệu?",
      "options": [
        "Byte",
        "Kilobyte",
        "Bit",
        "Megabyte"
      ],
      "correct": 2,
      "points": 100,
      "time": 20
    }
  ]
};

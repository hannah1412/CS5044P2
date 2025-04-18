export function loadAndProcessData(url) {
  return new Promise((resolve, reject) => {
    // Placeholder mock data
    resolve({
      scotland: {
        age: [
          { category: "16-24", value: 40 },
          { category: "25-34", value: 60 },
          { category: "75+", value: 20 }
        ],
        income: [
          { category: "up to £10,000", value: 30 },
          { category: "£10,001 - £21,374", value: 70 },
          { category: "£21,375 - 35,000", value: 90 }
        ],
        health: [
          { category: "Hearing", value: 50 },
          { category: "Blindness", value: 80 },
          { category: "Mobility", value: 100 }
        ]
      },
      england: {
        age: [
          { category: "16-24", value: 70 },
          { category: "25-34", value: 30 },
          { category: "75+", value: 900 }
        ],
        income: [
          { category: "up to £10,000", value: 45 },
          { category: "£10,001 - £21,374", value: 25 },
          { category: "£21,375 - 35,000", value: 70 }
        ],
        health: [
          { category: "Hearing", value: 10 },
          { category: "Blindness", value: 5 },
          { category: "Mobility", value: 50 }
        ]
      }
    });
  });
}

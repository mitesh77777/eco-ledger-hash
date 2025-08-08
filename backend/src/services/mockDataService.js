class MockDataService {
  generateSolarData() {
    const hour = new Date().getHours();
    const baseOutput = Math.sin((hour - 6) * Math.PI / 12) * 80 + 20;
    return {
      currentOutput: Math.max(0, baseOutput + Math.random() * 20 - 10),
      efficiency: 92 + Math.random() * 6,
      weatherCondition: hour > 6 && hour < 18 ? 'sunny' : 'night',
      temperature: 25 + Math.random() * 15,
      irradiance: Math.max(0, baseOutput * 10),
    };
  }
}

module.exports = new MockDataService();

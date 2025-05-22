console.log('Debug file loaded at: ' + new Date().toISOString());

export const debugInfo = {
  loadedAt: new Date().toISOString(),
  checkComponent: (componentName) => {
    console.log(`Component ${componentName} loaded at ${new Date().toISOString()}`);
    return true;
  }
}; 
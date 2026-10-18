try {
  var scheme = localStorage.getItem('mantine-color-scheme-value') === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
} catch (error) {}

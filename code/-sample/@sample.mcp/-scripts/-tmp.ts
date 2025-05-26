const file = import.meta.filename ?? '';
console.info('👋', file.split(/[/\\]/).slice(-2).join('/'));

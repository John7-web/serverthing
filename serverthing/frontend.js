fetch("https://your-repl-url/create-game", {
  method: "POST"
}).then(r => r.json()).then(console.log);

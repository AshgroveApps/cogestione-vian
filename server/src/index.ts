import app from "./app";
import config from "./config";

app.listen(config.port, () => {
  console.log(
    `Cogestione Vian — server avviato su http://localhost:${config.port}${
      config.isProd ? " (produzione)" : " (sviluppo)"
    }`
  );
  if (!config.isProd && !process.env.REP_PIN) {
    console.log(
      "Attenzione: PIN rappresentanti predefinito in uso. Imposta REP_PIN nelle variabili d'ambiente."
    );
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: "true" })); 
app.use(bodyParser.json()); 
app.use(bodyParser.json({ type: "application/vnd.api+json" })); 
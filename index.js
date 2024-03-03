import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Ycgmcth&",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = []


async function getUsers() {
  let users = []
  const result = await db.query("SELECT * FROM users");
  result.rows.forEach(user => {
    users.push(user)
  })
  return users
}

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM countries_visited");
  let countries = [];
  console.log(result)
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

const render = (res) => {

}

// async function getUserData(id) {
//   const result = db.query("SELECT user_name, country_code FROM users JOIN countries_visited ON users.id = user_id AND users.id = ($1) ", [id])
//   console.log(result)
//   let countries = []
//   result.rows.forEach((country) => {
//     countries.push(country.country_code)
//   })
//   return countries
// }


app.get("/", async (req, res) => {
  let users = await getUsers();
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: 'white',
  });
});


app.post("/add", async (req, res) => {
  const input = req.body["country"];
  let id = currentUserId

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO countries_visited (country_code, user_id) VALUES ($1, $2)",
        [countryCode, id]
      );
      currentUserId = id
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});


app.post("/user", async (req, res) => {
  if(req.body.user){
    let users = await getUsers();
    const id = req.body.user.toString()
    currentUserId = id
    let color = ""
    try{
      //gets user's country list based of ID
      const userCountries = await db.query("SELECT user_name, country_code FROM users JOIN countries_visited ON users.id = user_id AND users.id=" + id)
      let countries = []
      userCountries.rows.forEach((country) => {
        countries.push(country.country_code)
      })
      //Gets user's color
      const userColor = await db.query("SELECT user_color FROM users WHERE id=" + id)
      color =userColor.rows[0].user_color
      
      res.render("index.ejs", { 
        countries: countries,
        total: countries.length,
        users: users,
        color: color, }) 
    } catch(err) {
      console.log(err)
    }
  } else if(req.body.add){
    res.render('new.ejs')
  }
  
  
});

app.post("/new", async (req, res) => {
  const name = req.body.name
  const color = req.body.color
  await db.query("INSERT INTO users (user_name, user_color) VALUES (($1),($2))", [name, color])
  res.redirect('/')

  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

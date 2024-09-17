## Installation Instructions
### Prerequisites:
1) Node JS
Download and install NodeJS from https://nodejs.org/en/
2) Mongo DB
For this project we have installed MongoDB from the Community Center.

### Steps to run the application
1) Start your mongoDB server and client:
	1) run command prompt as an administrator
		- Navigate to bin folder inside MongoDB and execute the command below:
		- `mongod.exe --dbpath "C:\db"`
	2) run command prompt as an administrator
		- Navigate to bin folder inside MongoDB and execute the command below:
		- `mongod.exe`
		Example: C:\Program Files\MongoDB\Server\4.3\bin>mongod.exe
2) Unzip the project folder
3) Run node.js command prompt
	- Navigate to the project folder
	- Run the below commands
		- `npm install`
		- `node app.js` OR `npm run app`
4) Open your browser and run the localhost https://localhost:3000/ to see the chess web app running.

## Code structure and files description:
	• App.js: This file marks the starting point of the game. This launches the game on localhost at port 3000. This also has all the routes defined.
	• Package.json and packages-lock.json: These files have all the dependencies required to run the project.
	• .env: This file contains default values related to this the project.
	• index.html: This file is offline page for playing with chess engine (Stockfish).
	• Node Modules folder: This folder contains all dependencies packages related to this the project.
	• Views folder: This folder has all the handlebars files with .hbs extension which handles HTML templating for User Interface.
	• Routes folder: This folder contains all the javascript files with .js extension. These files route all the REST API requests like get and post, to get data from user and send it to the database, or fetch data from database and display to the user.
	• Models folder: This folder contains mongoDB schemas for defining users.
	• Public folder: This folder contains all files needed by the client.
	• Public > Lib folder: This folder contains all libraries needed by this the project.
	• Public > Lib > Engines folder: This folder contains all engines used in the project.
	• Public > JS folder: This folder contains all javascript files needed by the client.
	• Public > JS > main.js: This file has the logic and working of all the handlebars files.
	• Config > database.js: This file creates connection with the database.
	• App > passport.js: This file handles user authentication.
	• APP > socket.js: This file handles all socket requests related to the server. It also handles new connections and disconnections.
	• App > util.js: This file creates salt hashes to store passwords, generate tokens for matches and verify passwords.
	• Certificates folder: This folder contains certificates generated for SSL.

## Bibliography
1) http://chessboardjs.com/
2) https://github.com/jhlywa/chess.js
3) https://stockfishchess.org/
4) https://github.com/coreinfrastructure/best-practices-badge/blob/master/doc/security.md
5) https://justin.kelly.org.au/how-to-create-a-self-sign-ssl-cert-with-no-pa/
6) https://blog.risingstack.com/node-hero-node-js-authentication-passport-js/
7) https://fosterelli.co/dangerous-use-of-express-body-parser
8) https://docs.mongodb.com/manual/tutorial/configure-ssl/

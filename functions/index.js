// TODO database rules in their own JSON file.

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

// Function to watch for players arriving in the lobby
exports.newPlayer = functions.database.ref('/lobby').onWrite(event => {
	const playersInLobby = Object.keys(event.data.val());

	// Pair up players if there are two...
	if (playersInLobby.length === 2) {
		console.log(`Need to start a game between "${playersInLobby[0]}" and "${playersInLobby[1]}"`);

		const newGameId = Date.now();

		let newGame = {
			moves: {}
		};

		newGame.moves[playersInLobby[0]] = 'pending';
		newGame.moves[playersInLobby[1]] = 'pending';

		console.log(`Setting "/games/${newGameId}" to ${JSON.stringify(newGame)}`);

		// Delete these players from the lobby...
		const updates = {};

		updates[`/games/${newGameId}`] = newGame;
		updates[`/lobby`] = {};

		// And add them to the new game...
		return admin.database().ref().update(updates);
	} else {
		console.log(`User "${playersInLobby[0]}" is the only user in the lobby, awaiting a challenger...`);
		return 0;
	}
});

// Function to watch for players making a move...
exports.gameStatusChange = functions.database.ref('/games/{gameId}/moves').onUpdate(event => {
	console.log(`/games/${event.params.gameId} was updated.`);

	const rawData = event.data.val();

	console.log(`Data: ${JSON.stringify(rawData)}`);

	const gamePlayers = Object.keys(rawData);
	const player1Name = gamePlayers[0];
	const player2Name = gamePlayers[1];
	const player1Move = rawData[player1Name];
	const player2Move = rawData[player2Name];
	const results = {};

	// Check if either move is pending and do nothing if so
	if (player1Move === 'pending' || player2Move === 'pending') {
		console.log('Still waiting for both players to make a move.');
		return 0;
	}

	if (player1Move === player2Move) {
		console.log(`Both players played "${player1Move}", try again!`);

		results[player1Name] = 'retry';
		results[player2Name] = 'retry';

		const moves = {};
		moves[player1Name] = 'pending';
		moves[player2Name] = 'pending';

		const updates = {};
		updates[`/games/${event.params.gameId}/result`] = results;
		updates[`/games/${event.params.gameId}/moves`] = moves;

		return admin.database().ref().update(updates);
	}

	let winnerName;

	switch (player1Move) {
		case 'rock':
			if (player2Move === 'paper') {
				console.log(`${player2Name} wins, paper beat rock`);
				winnerName = player2Name;
			} else {
				console.log(`${player1Name} wins, rock beats scissors`);
				winnerName = player1Name;
			}

			break;
		case 'paper':
			if (player2Move === 'rock') {
				console.log(`${player1Name} wins, paper beats rock`);
				winnerName = player1Name;
			} else {
				console.log(`${player2Name} wins, scissors beats paper`);
				winnerName = player2Name;
			}

			break;
		case 'scissors':
			if (player2Move === 'paper') {
				console.log(`${player1Name} wins, scissors beats paper`);
				winnerName = player1Name;
			} else {
				console.log(`${player2Name} wins, rock beats scissors`);
				winnerName = player2Name;
			}

			break;
		default:
			// TODO this should not happen...
			console.log(`Someone made an illegal move!`);
	}

	if (winnerName === player1Name) {
		results[player1Name] = 'win';
		results[player2Name] = 'lose';
	} else {
		results[player2Name] = 'win';
		results[player1Name] = 'lose';
	}

	admin.database().ref(`/scores/${winnerName}`).once('value').then(function(winnerCurrentScoreSnapshot) {
		// When someone wins, update scoreboard and delete this game... or do something with it?
		let newScore = 1;

		if (winnerCurrentScoreSnapshot.val()) {
			newScore = winnerCurrentScoreSnapshot.val() + 1;
		} 

		admin.database().ref(`/scores/${winnerName}`).set(newScore);

		// Remove the game after a short delay.
		setTimeout(() => {
			admin.database().ref(`/games/${event.params.gameId}`).set({});
		}, 5000);		
	});

	return admin.database().ref(`/games/${event.params.gameId}/result`).set(results);
});
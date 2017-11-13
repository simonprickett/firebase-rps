'use strict';

const app = {
	initialize: () => {
		// Listen for a click on the login button.
		$('#loginButton').on('click', (event) => {
			event.preventDefault();
			app.loginUser();
		});
	},

	loginUser: () => {
		// Log the user in with Facebook 
		const provider = new firebase.auth.FacebookAuthProvider();

		firebase.auth().signInWithPopup(provider).then((result) => {
			const user = firebase.auth().currentUser;

			// Hide intro message, show gameplay area, logged in user
			// info and high scores

			$('#introArea').hide();
			$('#gamePlayArea').show();

			$('#loggedInUserArea').html(`<img src="${user.photoURL}"><p>${user.displayName}</p>`);
			$('#loggedInUserArea').show();

			// Create a user object in Firebase DB, so other users can see this one's 
			// name and profile
			firebase.database().ref(`/users/${user.uid}`).set({
    			displayName: user.displayName,
    			photoURL: user.photoURL
  			});

			$('#highScoreArea').show();

			// Listen for a click on the enter lobby button.
			$('#enterLobbyButton').on('click', (event) => {
				event.preventDefault();
				app.enterLobby(user.uid);

			})

			// Register for high score table events
			const highScoreRef = firebase.database().ref('/scores');
			highScoreRef.on('value', app.onHighScoreUpdate);
		});		
	},

	enterLobby: (userUid) => {
		firebase.database().ref(`/lobby/${userUid}`).set(true);
		$('#enterLobbyArea').hide();
		$('#waitingForOpponentArea').show();

		const myGameRef = firebase.database().ref(`/userGames/${userUid}`);
		myGameRef.on('value', app.onGameStarted);
	},

	onHighScoreUpdate: (snapshot) => {
		const highScores = snapshot.val();
		let highScoreHtml = '<ul>';

		for (const playerId in highScores) {
			highScoreHtml = `${highScoreHtml}<li>${playerId}: ${highScores[playerId]}</li>`;
		}

		highScoreHtml = `${highScoreHtml}</ul>`;
		
		$('#highScoreTable').html(highScoreHtml);
	},

	onGameStarted: (snapshot) => {
		const gameId = snapshot.val();

		if (gameId) {
			$('#waitingForOpponentArea').hide();
			$('#makeAMoveArea').show();
			$('.moveButton').on('click', { gameId: gameId }, app.onPlayerMove);
		}
	},

	onPlayerMove: function(event) {
		const playerMove = $(this).data('move');
		const userUid = firebase.auth().currentUser.uid;
		// TODO need game id to set:
		console.log(`/games/${event.data.gameId}/moves/${userUid}: ${playerMove}`);
	}
};

document.addEventListener('DOMContentLoaded', () => {
	app.initialize();
});
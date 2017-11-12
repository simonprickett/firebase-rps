TODO

* Player hits button to sign up
* Player hits button to join a game
* Adds player to /waitingToPlay and /scores with initial 0 score
* Function triggers on /waitingToPlay create
* Function assigns two users to a new game /gameinProgress/<id> deletes them from /waitingToPlay keys
* Users move is set to "pending" in /gamesInProgress/<id>/<userid>
* When /gamesInProgress/<id> is updated, function checks that both users have played a move and if so sets "winner" to "true" or "false" for each player
* Function updates score for winner
* Player hits button to join a game...
* Old games deleted after 10 mins?

Deploy all functions:

```
firebase deploy --only functions
```

Or a single function:

```
firebase deploy --only functions:<functionName>
```
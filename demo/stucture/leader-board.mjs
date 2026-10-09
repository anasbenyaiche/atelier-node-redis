class LeaderBoard {
  constructor(key, client) {
    this.key = key;
    this.client = client;
  }
  // méthode d'ajout des clé
  async addUser(username, score) {
    await this.client.zAdd(this.key, { score: score, value: username });
    console.log("User ", username, "est ajouter au Leaderboard");
  }
  // supprimer un user
  async removeUser(username) {
    await this.client.zRem(this.key, username);
    console.log("User ", username, "a été supprime du Leaderboard");
  }

  async getUserScoreAndRank(username) {
    const score = await this.client.zScore(this.key, username);
    const rank = await this.client.zRevRank(this.key, username);

    console.log(` detail de ${username} => Score: ${score} & Rank ${rank + 1}`);
  }

  async showTopUsers(quantity) {
    const response = await this.client.zRangeWithScores(this.key, 0, quantity - 1, {
      REV: true,
    });
    console.log(`Top users ${quantity}`);
      response.forEach((user, i) => {
        console.log(`# ${i} ${user.value}  ${user.score} ${quantity}`);
      });
  }
    async showWorstUsers(quantity) {
      console.log("show worst users ")
    const response = await this.client.zRangeWithScores(this.key, 0, quantity - 1, {
    });
    console.log(`Top users ${quantity}`);
      response.forEach((user, i) => {
        console.log(`# ${i} ${user.value}  ${user.score} ${quantity}`);
      });
  }
}
export default LeaderBoard;



// const leaderBoard = new LeaderBoard("quizz", client)
// await leaderBoard.addUser("Arthur", 70);
// await leaderBoard.addUser("KC", 20);
// await leaderBoard.addUser("Maxwell", 10);
// await leaderBoard.addUser("Patrik", 30);
// await leaderBoard.addUser("Anas", 60);
// await leaderBoard.addUser("Felipe", 40);
// await leaderBoard.addUser("Renata", 50);
// await leaderBoard.addUser("Hugo", 80);

// await leaderBoard.removeUser("Arthur");
// await leaderBoard.getUserScoreAndRank("Anas");
// await leaderBoard.showTopUsers(8);
// await leaderBoard.showWorstUsers(3);

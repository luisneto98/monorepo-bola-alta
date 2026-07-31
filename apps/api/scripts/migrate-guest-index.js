/**
 * Migração: presenças de convidado.
 *
 * O índice `{ game: 1, user: 1 }` era unique simples. Como convidados não têm `user`,
 * o Mongo trataria todos como o mesmo `null` e recusaria o segundo convidado da
 * pelada com E11000. O índice novo é parcial (só vale quando `user` existe).
 *
 * O Mongoose CRIA índices novos, mas nunca REMOVE os antigos — por isso este script.
 * É idempotente: rodar duas vezes não faz mal.
 *
 * Uso:
 *   MONGO_URI="mongodb://..." node scripts/migrate-guest-index.js
 */
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('Defina MONGO_URI.');
  process.exit(1);
}

const ALVO = 'game_1_user_1';

(async () => {
  const client = new MongoClient(uri);
  await client.connect();

  const col = client.db().collection('attendances');
  const indexes = await col.indexes();
  const atual = indexes.find((i) => i.name === ALVO);

  if (!atual) {
    console.log(`Índice ${ALVO} não existe — nada a fazer.`);
  } else if (atual.partialFilterExpression) {
    console.log(`Índice ${ALVO} já é parcial — nada a fazer.`);
  } else {
    console.log(`Removendo ${ALVO} (unique simples)...`);
    await col.dropIndex(ALVO);
    console.log('Removido. O Mongoose recria a versão parcial ao subir a API.');
  }

  // Sem isto, `guest.nameKey` fica sem índice até a API subir; criar aqui é barato.
  await col.createIndex({ 'guest.nameKey': 1 });

  console.log('\nÍndices agora:');
  for (const i of await col.indexes()) {
    console.log(' -', i.name, i.partialFilterExpression ? '(parcial)' : '');
  }

  await client.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

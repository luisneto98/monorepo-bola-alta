/**
 * Cria o admin inicial e uma pelada de exemplo.
 *   npm run seed -w @bola-alta/api
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { UserSchema, UserRole, UserStatus } from '../users/schemas/user.schema';
import { GameSchema, GameStatus } from '../games/schemas/game.schema';

async function main() {
  const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27017/bola-alta';
  await mongoose.connect(uri);

  const User = mongoose.model('User', UserSchema);
  const Game = mongoose.model('Game', GameSchema);

  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@bolaalta.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'bolaalta123';

  let admin = await User.findOne({ email });
  if (admin) {
    console.log(`Admin já existe: ${email}`);
  } else {
    admin = await User.create({
      name: process.env.SEED_ADMIN_NAME ?? 'Organizador',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      approvedAt: new Date(),
    });
    console.log(`Admin criado: ${email} / ${password}`);
  }

  if ((await Game.estimatedDocumentCount()) === 0) {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    date.setHours(20, 0, 0, 0);

    await Game.create({
      title: 'Pelada de quinta',
      date,
      durationMinutes: 120,
      location: { name: 'Ginásio Central', address: 'Rua da Quadra, 100' },
      minPlayers: 12,
      maxPlayers: 18,
      cost: 240,
      status: GameStatus.PENDING,
      createdBy: String(admin._id),
    });
    console.log('Pelada de exemplo criada.');
  }

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

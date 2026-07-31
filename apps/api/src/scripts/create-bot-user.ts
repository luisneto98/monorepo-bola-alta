/**
 * Cria (ou atualiza a senha do) usuário de serviço do bot de WhatsApp.
 *
 * O bot precisa de identidade própria para chamar a API: ele cria peladas e
 * sincroniza a lista, o que exige ADMIN. Usar a conta pessoal de alguém tornaria
 * impossível distinguir no histórico o que foi feito por gente e o que foi bot.
 *
 *   BOT_PASSWORD=... npm run bot:user -w @bola-alta/api
 *
 * Idempotente: rodar de novo só troca a senha.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

import { UserSchema, UserRole, UserStatus } from '../users/schemas/user.schema';

async function main() {
  const uri = process.env.MONGO_URI ?? 'mongodb://localhost:27017/bola-alta';
  await mongoose.connect(uri);

  const User = mongoose.model('User', UserSchema);

  const email = (process.env.BOT_EMAIL ?? 'bot@bolaalta.local').toLowerCase();
  const password = process.env.BOT_PASSWORD ?? randomBytes(18).toString('hex');
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ email });

  if (existing) {
    existing.set({
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
    });
    await existing.save();
    console.log(`Usuário do bot atualizado: ${email}`);
  } else {
    await User.create({
      name: process.env.BOT_NAME ?? 'Bot do Grupo',
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
      approvedAt: new Date(),
    });
    console.log(`Usuário do bot criado: ${email}`);
  }

  console.log('\nColoque no .env do orquestrador:');
  console.log(`  BOLA_ALTA_EMAIL=${email}`);
  console.log(`  BOLA_ALTA_PASSWORD=${password}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

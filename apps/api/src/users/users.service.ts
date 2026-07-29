import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User, UserDocument, UserRole, UserStatus } from './schemas/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user;
  }

  async findByEmailWithPassword(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .lean();
  }

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }) {
    const email = data.email.toLowerCase().trim();
    const exists = await this.userModel.exists({ email });
    if (exists) throw new BadRequestException('Esse e-mail já está cadastrado.');

    // O primeiro cadastro da base vira admin aprovado — senão ninguém aprova ninguém.
    const isFirst = (await this.userModel.estimatedDocumentCount()) === 0;

    const created = await this.userModel.create({
      name: data.name.trim(),
      email,
      phone: data.phone?.replace(/\D/g, ''),
      passwordHash: await bcrypt.hash(data.password, 10),
      role: isFirst ? UserRole.ADMIN : UserRole.PLAYER,
      status: isFirst ? UserStatus.APPROVED : UserStatus.PENDING,
      approvedAt: isFirst ? new Date() : undefined,
    });

    return this.findById(String(created._id));
  }

  list(status?: UserStatus) {
    return this.userModel
      .find(status ? { status } : {})
      .sort({ status: 1, name: 1 })
      .lean();
  }

  /** Aprovados, para listas de seleção (ex.: adicionar alguém numa pelada). */
  listApproved() {
    return this.userModel
      .find({ status: UserStatus.APPROVED })
      .sort({ name: 1 })
      .lean();
  }

  async setStatus(id: string, status: UserStatus, adminId: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        status,
        approvedAt: status === UserStatus.APPROVED ? new Date() : undefined,
        approvedBy: adminId,
      },
      { new: true },
    );
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user.toObject();
  }

  async setRole(id: string, role: UserRole, requesterId: string) {
    if (id === requesterId) {
      throw new BadRequestException('Você não pode alterar seu próprio papel.');
    }
    const user = await this.userModel.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user.toObject();
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.phone !== undefined) patch.phone = dto.phone.replace(/\D/g, '');
    if (dto.position !== undefined) patch.position = dto.position;
    if (dto.level !== undefined) patch.level = dto.level;

    const user = await this.userModel.findByIdAndUpdate(id, patch, { new: true });
    if (!user) throw new NotFoundException('Usuário não encontrado.');
    return user.toObject();
  }

  async changePassword(id: string, currentPassword: string, newPassword: string) {
    const user = await this.userModel.findById(id).select('+passwordHash');
    if (!user) throw new NotFoundException('Usuário não encontrado.');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Senha atual incorreta.');

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return { ok: true };
  }

  async remove(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new BadRequestException('Você não pode remover a si mesmo.');
    }
    await this.userModel.findByIdAndDelete(id);
    return { ok: true };
  }
}

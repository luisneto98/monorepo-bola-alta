import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import webpush from 'web-push';

import {
  PushSubscription,
  PushSubscriptionDocument,
} from './schemas/push-subscription.schema';

export interface PushPayload {
  title: string;
  body: string;
  /** Caminho relativo dentro do app, ex.: /peladas/abc123 */
  url?: string;
}

@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    @InjectModel(PushSubscription.name)
    private readonly subModel: Model<PushSubscriptionDocument>,
  ) {}

  onModuleInit() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      this.logger.warn(
        'VAPID não configurado — push desativado. Rode `npm run vapid` e preencha o .env.',
      );
      return;
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? 'mailto:admin@bola-alta.local',
      publicKey,
      privateKey,
    );
    this.enabled = true;
  }

  get publicKey() {
    return process.env.VAPID_PUBLIC_KEY ?? null;
  }

  async subscribe(
    userId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ) {
    await this.subModel.findOneAndUpdate(
      { endpoint: sub.endpoint },
      {
        user: new Types.ObjectId(userId),
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent,
      },
      { upsert: true },
    );
    return { ok: true };
  }

  async unsubscribe(endpoint: string) {
    await this.subModel.deleteOne({ endpoint });
    return { ok: true };
  }

  async sendToUsers(userIds: string[], payload: PushPayload) {
    if (!this.enabled || !userIds.length) return;

    const subs = await this.subModel
      .find({ user: { $in: userIds.map((id) => new Types.ObjectId(id)) } })
      .lean();

    await this.dispatch(subs, payload);
  }

  async broadcast(payload: PushPayload, opts?: { exceptUserId?: string }) {
    if (!this.enabled) return;

    const filter = opts?.exceptUserId
      ? { user: { $ne: new Types.ObjectId(opts.exceptUserId) } }
      : {};
    const subs = await this.subModel.find(filter).lean();

    await this.dispatch(subs, payload);
  }

  private async dispatch(subs: any[], payload: PushPayload) {
    const body = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            body,
          );
        } catch (error: any) {
          // 404/410 = inscrição morta (usuário desinstalou ou limpou o navegador).
          if (error?.statusCode === 404 || error?.statusCode === 410) {
            await this.subModel.deleteOne({ endpoint: sub.endpoint });
          } else {
            this.logger.warn(`Falha ao enviar push: ${error?.message}`);
          }
        }
      }),
    );
  }
}

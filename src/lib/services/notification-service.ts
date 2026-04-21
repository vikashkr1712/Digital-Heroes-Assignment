import { NotificationType } from "@prisma/client";

import { sendBulkNotificationEmails, sendNotificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
): Promise<void> {
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  });

  try {
    await sendNotificationEmail(
      {
        email: notification.user.email,
        name: notification.user.name,
      },
      title,
      message,
    );
  } catch (error) {
    console.error("Failed to send notification email", error);
  }
}

export async function notifyManyUsers(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
): Promise<void> {
  if (userIds.length === 0) {
    return;
  }

  const dedupedUserIds = [...new Set(userIds)];

  const recipients = await prisma.user.findMany({
    where: {
      id: {
        in: dedupedUserIds,
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  await prisma.notification.createMany({
    data: dedupedUserIds.map((userId) => ({
      userId,
      type,
      title,
      message,
    })),
  });

  try {
    await sendBulkNotificationEmails(
      recipients.map((recipient) => ({
        email: recipient.email,
        name: recipient.name,
      })),
      title,
      message,
    );
  } catch (error) {
    console.error("Failed to send bulk notification email", error);
  }
}

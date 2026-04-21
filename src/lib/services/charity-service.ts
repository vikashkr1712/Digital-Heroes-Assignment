import { DonationType, NotificationType } from "@prisma/client";

import { MIN_CHARITY_PERCENTAGE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/services/notification-service";

export async function listCharities(
  search?: string,
  options?: {
    featuredOnly?: boolean;
    limit?: number;
  },
) {
  return prisma.charity.findMany({
    where: {
      isActive: true,
      featured: options?.featuredOnly ? true : undefined,
      OR: search
        ? [
            { name: { contains: search } },
            { description: { contains: search } },
          ]
        : undefined,
    },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    take: options?.limit,
  });
}

export async function getCharityBySlug(slug: string) {
  return prisma.charity.findFirst({
    where: {
      slug: slug.toLowerCase(),
      isActive: true,
    },
  });
}

export async function listCharitiesForAdmin() {
  return prisma.charity.findMany({
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });
}

export async function createCharity(input: {
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  websiteUrl?: string;
  upcomingEvent?: string;
  featured?: boolean;
}) {
  return prisma.charity.create({
    data: {
      name: input.name,
      slug: input.slug.toLowerCase(),
      description: input.description,
      imageUrl: input.imageUrl,
      websiteUrl: input.websiteUrl,
      upcomingEvent: input.upcomingEvent,
      featured: input.featured ?? false,
    },
  });
}

export async function updateCharity(input: {
  charityId: string;
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  websiteUrl?: string;
  upcomingEvent?: string;
  featured?: boolean;
  isActive?: boolean;
}) {
  const { charityId, ...rest } = input;

  return prisma.charity.update({
    where: { id: charityId },
    data: {
      ...rest,
      slug: rest.slug?.toLowerCase(),
    },
  });
}

export async function deleteCharity(charityId: string) {
  await prisma.charity.delete({ where: { id: charityId } });
}

export async function createIndependentDonation(
  userId: string,
  charityId: string,
  amountCents: number,
) {
  const donation = await prisma.donation.create({
    data: {
      userId,
      charityId,
      amountCents,
      type: DonationType.INDEPENDENT,
    },
  });

  await notifyUser(
    userId,
    NotificationType.SYSTEM,
    "Donation successful",
    "Thank you for making an independent charity donation.",
  );

  return donation;
}

export async function updateUserCharityPreferences(
  userId: string,
  charityId: string,
  charityPercentage: number,
) {
  const finalPercentage = Math.max(charityPercentage, MIN_CHARITY_PERCENTAGE);

  return prisma.user.update({
    where: { id: userId },
    data: {
      charityId,
      charityPercentage: finalPercentage,
    },
    select: {
      id: true,
      charityId: true,
      charityPercentage: true,
    },
  });
}

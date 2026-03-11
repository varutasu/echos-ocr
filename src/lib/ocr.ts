import { prisma } from "./db";
import { Prisma } from "@/generated/prisma/client";
import { uploadBuffer, getBuffer, deleteObject } from "./minio";
import { ocrImage } from "./ai-ocr";
import { pdfToImages, imageToBase64, processUploadedImage } from "./pdf";

export async function processFile(
  jobId: string,
  fileName: string,
  fileBuffer: Buffer,
  isPdf: boolean
): Promise<string[]> {
  const cardIds: string[] = [];

  try {
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "processing" },
    });

    let pageImages: { buffer: Buffer; page: number }[];

    if (isPdf) {
      pageImages = await pdfToImages(fileBuffer);
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { totalPages: pageImages.length },
      });
    } else {
      const processed = await processUploadedImage(fileBuffer);
      pageImages = [{ buffer: processed, page: 1 }];
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { totalPages: 1 },
      });
    }

    const sourceKey = `sources/${jobId}/${fileName}`;
    await uploadBuffer(sourceKey, fileBuffer, isPdf ? "application/pdf" : "image/jpeg");

    // Pair pages: page 1 = response card (back), page 2 = survey (front), etc.
    const pairs: { response?: typeof pageImages[0]; survey?: typeof pageImages[0] }[] = [];
    for (let i = 0; i < pageImages.length; i += 2) {
      pairs.push({
        response: pageImages[i],
        survey: pageImages[i + 1],
      });
    }

    // If single image (not PDF), treat as response card side
    if (!isPdf && pageImages.length === 1) {
      pairs.length = 0;
      pairs.push({ response: pageImages[0] });
    }

    for (const pair of pairs) {
      const card = await prisma.responseCard.create({
        data: {
          sourceFile: sourceKey,
          ocrStatus: "processing",
        },
      });
      cardIds.push(card.id);

      try {
        let responseData: Record<string, unknown> = {};
        let surveyData: Record<string, unknown> = {};
        let totalConfidence = 0;
        let confidenceCount = 0;

        if (pair.response) {
          const imgKey = `images/${card.id}/response.jpg`;
          await uploadBuffer(imgKey, pair.response.buffer, "image/jpeg");
          await prisma.responseCard.update({
            where: { id: card.id },
            data: { backImagePath: imgKey },
          });

          const base64 = await imageToBase64(pair.response.buffer);
          const result = await ocrImage(base64, "response");
          responseData = result.data;
          totalConfidence += result.confidence;
          confidenceCount++;
        }

        if (pair.survey) {
          const imgKey = `images/${card.id}/survey.jpg`;
          await uploadBuffer(imgKey, pair.survey.buffer, "image/jpeg");
          await prisma.responseCard.update({
            where: { id: card.id },
            data: { frontImagePath: imgKey },
          });

          const base64 = await imageToBase64(pair.survey.buffer);
          const result = await ocrImage(base64, "survey");
          surveyData = result.data;
          totalConfidence += result.confidence;
          confidenceCount++;
        }

        const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

        await prisma.responseCard.update({
          where: { id: card.id },
          data: {
            name: asString(responseData.name),
            gender: asString(responseData.gender),
            dateOfBirth: asString(responseData.dateOfBirth),
            maritalStatus: asString(responseData.maritalStatus),
            maritalStatusOther: asString(responseData.maritalStatusOther),
            visitType: asString(responseData.visitType),
            cellPhone: asString(responseData.cellPhone),
            homePhone: asString(responseData.homePhone),
            email: asString(responseData.email),
            address: asString(responseData.address),
            aptNumber: asString(responseData.aptNumber),
            city: asString(responseData.city),
            state: asString(responseData.state),
            zip: asString(responseData.zip),
            prayerRequests: asString(responseData.prayerRequests),
            prayerForTeam: asBool(responseData.prayerForTeam),
            prayerConfidential: asBool(responseData.prayerConfidential),
            messageTopics: surveyData.messageTopics ?? [],
            messageTopicsOther: asString(surveyData.messageTopicsOther),
            nextStep: surveyData.nextStep ?? [],
            attendanceDuration: asString(surveyData.attendanceDuration),
            campusPreference: surveyData.campusPreference ?? [],
            campusPreferenceOther: asString(surveyData.campusPreferenceOther),
            howHeard: surveyData.howHeard ?? [],
            howHeardOther: asString(surveyData.howHeardOther),
            serviceAttended: asString(surveyData.serviceAttended),
            ocrStatus: "complete",
            ocrConfidence: Math.round(avgConfidence),
            rawOcrResponse: JSON.parse(JSON.stringify({ response: responseData, survey: surveyData })),
          },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown OCR error";
        await prisma.responseCard.update({
          where: { id: card.id },
          data: { ocrStatus: "error", ocrError: message },
        });
      }

      await prisma.processingJob.update({
        where: { id: jobId },
        data: { processed: { increment: 1 } },
      });
    }

    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "complete", cardIds },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: "error", error: message },
    });
  }

  return cardIds;
}

export async function reprocessCard(cardId: string): Promise<void> {
  const card = await prisma.responseCard.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("Card not found");
  if (!card.backImagePath && !card.frontImagePath) {
    throw new Error("No stored images available for reprocessing");
  }

  await prisma.responseCard.update({
    where: { id: cardId },
    data: { ocrStatus: "processing", ocrError: null },
  });

  try {
    let responseData: Record<string, unknown> = {};
    let surveyData: Record<string, unknown> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;

    if (card.backImagePath) {
      const imgBuffer = await getBuffer(card.backImagePath);
      const base64 = await imageToBase64(imgBuffer);
      const result = await ocrImage(base64, "response");
      responseData = result.data;
      totalConfidence += result.confidence;
      confidenceCount++;
    }

    if (card.frontImagePath) {
      const imgBuffer = await getBuffer(card.frontImagePath);
      const base64 = await imageToBase64(imgBuffer);
      const result = await ocrImage(base64, "survey");
      surveyData = result.data;
      totalConfidence += result.confidence;
      confidenceCount++;
    }

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    await prisma.responseCard.update({
      where: { id: cardId },
      data: {
        name: asString(responseData.name),
        gender: asString(responseData.gender),
        dateOfBirth: asString(responseData.dateOfBirth),
        maritalStatus: asString(responseData.maritalStatus),
        maritalStatusOther: asString(responseData.maritalStatusOther),
        visitType: asString(responseData.visitType),
        cellPhone: asString(responseData.cellPhone),
        homePhone: asString(responseData.homePhone),
        email: asString(responseData.email),
        address: asString(responseData.address),
        aptNumber: asString(responseData.aptNumber),
        city: asString(responseData.city),
        state: asString(responseData.state),
        zip: asString(responseData.zip),
        prayerRequests: asString(responseData.prayerRequests),
        prayerForTeam: asBool(responseData.prayerForTeam),
        prayerConfidential: asBool(responseData.prayerConfidential),
        messageTopics: surveyData.messageTopics ?? [],
        messageTopicsOther: asString(surveyData.messageTopicsOther),
        nextStep: surveyData.nextStep ?? [],
        attendanceDuration: asString(surveyData.attendanceDuration),
        campusPreference: surveyData.campusPreference ?? [],
        campusPreferenceOther: asString(surveyData.campusPreferenceOther),
        howHeard: surveyData.howHeard ?? [],
        howHeardOther: asString(surveyData.howHeardOther),
        serviceAttended: asString(surveyData.serviceAttended),
        ocrStatus: "complete",
        ocrConfidence: Math.round(avgConfidence),
        ocrError: null,
        rawOcrResponse: JSON.parse(JSON.stringify({ response: responseData, survey: surveyData })),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown OCR error";
    await prisma.responseCard.update({
      where: { id: cardId },
      data: { ocrStatus: "error", ocrError: message },
    });
  }
}

export async function reprocessJob(jobId: string): Promise<void> {
  const job = await prisma.processingJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error("Job not found");

  const oldCardIds = (job.cardIds as string[] | null) ?? [];
  for (const cardId of oldCardIds) {
    const card = await prisma.responseCard.findUnique({ where: { id: cardId } });
    if (card) {
      const deletes: Promise<void>[] = [];
      if (card.frontImagePath) deletes.push(deleteObject(card.frontImagePath));
      if (card.backImagePath) deletes.push(deleteObject(card.backImagePath));
      await Promise.allSettled(deletes);
      await prisma.responseCard.delete({ where: { id: cardId } });
    }
  }

  const sourceKey = `sources/${jobId}/${job.fileName}`;
  const fileBuffer = await getBuffer(sourceKey);
  const isPdf = job.fileName.toLowerCase().endsWith(".pdf");

  await prisma.processingJob.update({
    where: { id: jobId },
    data: { status: "queued", processed: 0, error: null, cardIds: Prisma.DbNull },
  });

  await processFile(jobId, job.fileName, fileBuffer, isPdf);
}

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  return String(v);
}

function asBool(v: unknown): boolean {
  return v === true;
}

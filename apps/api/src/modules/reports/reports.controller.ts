import { Controller, Get, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { ReportRow, UploadReportResponse } from "@biox/shared";
import type { User } from "@prisma/client";
import { CurrentUser } from "../auth/auth.decorators";
import { MAX_REPORT_PDF_BYTES, ReportsService, type UploadedReportFile } from "./reports.service";

@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /** POST /v1/reports — multipart field "file": the lab report PDF (≤ 20 MB). */
  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_REPORT_PDF_BYTES } }))
  uploadReport(
    @CurrentUser() user: User,
    @UploadedFile() file?: UploadedReportFile,
  ): Promise<UploadReportResponse> {
    return this.reportsService.uploadReport(user.id, file);
  }

  /** GET /v1/reports — "Recent uploads" table, newest first. */
  @Get()
  listReports(@CurrentUser() user: User): Promise<ReportRow[]> {
    return this.reportsService.listReports(user.id);
  }
}

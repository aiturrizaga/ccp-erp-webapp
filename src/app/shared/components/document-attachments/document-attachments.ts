import { Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { Attachment, AttachmentKind } from '@core/models';

const KIND_ICON: Record<AttachmentKind, string> = {
  image: 'tablerPhoto',
  pdf: 'tablerFileTypePdf',
  document: 'tablerPaperclip',
};

/** Read-only list of evidence/attachments — used on Suppliers, Purchase Orders, Goods Receipts, Output Bundles. */
@Component({
  selector: 'app-document-attachments',
  imports: [NgIcon],
  templateUrl: './document-attachments.html',
})
export class DocumentAttachments {
  readonly attachments = input.required<Attachment[]>();
  readonly emptyMessage = input('Sin evidencias adjuntas.');

  protected icon(kind: AttachmentKind): string {
    return KIND_ICON[kind];
  }
}

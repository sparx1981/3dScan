/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Project {
  id: string;
  name: string;
  mode: 'object' | 'room';
  status: 'uploading' | 'queued' | 'processing' | 'complete' | 'failed';
  photoCount: number;
  createdAt: string;
  updatedAt: string;
  thumbnailURL?: string;
  faceCount?: number;
}

export type CaptureMode = 'object' | 'room';

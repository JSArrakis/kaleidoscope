import { checkAnchorContentViability } from "./anchorContentViabilityService.js";
import { checkCadenceCommercialViability } from "./cadenceCommercialViabilityService.js";
import { canFacetsWalk } from "./facetWalkabilityService.js";
import {
  setAnchorContentReadinessStatus,
  setCadenceBufferReadinessStatus,
  setFacetWalkabilityReadinessStatus,
  getStartupReadinessStatus,
  type StartupReadinessStatus,
  type StartupReadinessCheckStatus,
} from "./streamManager.js";

function buildDetail(passed: boolean, detail: string): string {
  return passed ? `Ready: ${detail}` : `Warning: ${detail}`;
}

function buildCheckStatus(
  passed: boolean,
  detail: string,
): StartupReadinessCheckStatus {
  return {
    passed,
    detail: buildDetail(passed, detail),
  };
}

export function runStartupReadinessChecks(): StartupReadinessStatus {
  const anchorContent = checkAnchorContentViability();
  const facetWalkabilityPassed = canFacetsWalk();
  const cadenceBuffer = checkCadenceCommercialViability();

  const warnings: string[] = [];

  const anchorContentStatus = buildCheckStatus(
    anchorContent.hasFullDay,
    anchorContent.diagnostics.join(" "),
  );
  const facetWalkabilityStatus = buildCheckStatus(
    facetWalkabilityPassed,
    facetWalkabilityPassed
      ? "Facet graph meets the walkability threshold."
      : "Facet graph does not meet the walkability threshold.",
  );
  const cadenceBufferStatus = buildCheckStatus(
    cadenceBuffer.canRun,
    cadenceBuffer.diagnostics.join(" "),
  );

  const status: StartupReadinessStatus = {
    completedAt: Date.now(),
    anchorContent: anchorContentStatus,
    facetWalkability: facetWalkabilityStatus,
    cadenceBuffer: cadenceBufferStatus,
    warnings,
  };

  setAnchorContentReadinessStatus(anchorContentStatus);
  setFacetWalkabilityReadinessStatus(facetWalkabilityStatus);
  setCadenceBufferReadinessStatus(cadenceBufferStatus);

  if (!anchorContentStatus.passed) {
    warnings.push(anchorContentStatus.detail);
  }
  if (!facetWalkabilityStatus.passed) {
    warnings.push(facetWalkabilityStatus.detail);
  }
  if (!cadenceBufferStatus.passed) {
    warnings.push(cadenceBufferStatus.detail);
  }

  return status;
}

export function getStartupReadinessSnapshot(): StartupReadinessStatus | null {
  return getStartupReadinessStatus();
}

export function getAnchorContentReadinessSnapshot() {
  return getStartupReadinessStatus()?.anchorContent ?? null;
}

export function getFacetWalkabilityReadinessSnapshot() {
  return getStartupReadinessStatus()?.facetWalkability ?? null;
}

export function getCadenceBufferReadinessSnapshot() {
  return getStartupReadinessStatus()?.cadenceBuffer ?? null;
}

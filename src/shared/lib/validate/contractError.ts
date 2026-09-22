import type { ContractIssue } from "./contractError.types";

class ContractError extends Error {
  override readonly name = "ContractError";
  readonly issues: readonly ContractIssue[];

  public constructor(issues: ContractIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message ?? "unknown error"}`).join("; "));
    this.issues = issues;
  }
}

export { ContractError };

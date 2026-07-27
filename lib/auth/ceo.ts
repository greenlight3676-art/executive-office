export interface CEOIdentity {
  id: string;
  isCEO: boolean;
  name: string;
  roles: string[];
}

export interface CEOIdentityAdapter {
  getIdentity(): CEOIdentity;
}

export class DevelopmentCEOIdentityAdapter implements CEOIdentityAdapter {
  getIdentity(): CEOIdentity {
    return {
      id: "tj",
      isCEO: true,
      name: "TJ",
      roles: ["ceo", "admin"],
    };
  }
}

export function assertCEO(actor: CEOIdentity | null | undefined): CEOIdentity {
  if (!actor?.isCEO) {
    throw new Error("Only the CEO identity may perform this action.");
  }

  return actor;
}

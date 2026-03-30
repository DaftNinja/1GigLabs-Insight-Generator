const APOLLO_API_BASE = "https://api.apollo.io/api/v1";

interface ApolloOrganization {
  id: string;
  name: string;
  website_url?: string;
  linkedin_url?: string;
  industry?: string;
  estimated_num_employees?: number;
}

interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  headline?: string;
  linkedin_url?: string;
  organization?: {
    id: string;
    name: string;
    website_url?: string;
  };
  departments?: string[];
  seniority?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface ApolloContact {
  name: string;
  title: string;
  department: string;
  email: string;
  linkedin: string;
  source: string;
  sourceUrl: string;
  relevance: string;
}

function getApiKey(): string | null {
  const key = process.env.APOLLO_API_KEY;
  if (!key) {
    console.warn("APOLLO_API_KEY not set. Apollo.io search will be skipped, using AI sources only.");
    return null;
  }
  return key;
}

function mapDepartment(departments: string[] | undefined, title: string): string {
  if (departments && departments.length > 0) {
    const dept = departments[0].toLowerCase();
    if (dept.includes("engineering") || dept.includes("technology") || dept.includes("it")) return "IT";
    if (dept.includes("finance") || dept.includes("accounting")) return "Finance";
    if (dept.includes("marketing")) return "Marketing";
    if (dept.includes("sales") || dept.includes("business_development")) return "Sales";
    if (dept.includes("operations")) return "Operations";
    if (dept.includes("human_resources") || dept.includes("hr")) return "HR";
    if (dept.includes("legal")) return "Legal";
    if (dept.includes("executive") || dept.includes("c_suite")) return "Executive";
    if (dept.includes("product") || dept.includes("design")) return "Product";
    if (dept.includes("data") || dept.includes("analytics")) return "Data & Analytics";
    return departments[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const t = title.toLowerCase();
  if (t.includes("ceo") || t.includes("cfo") || t.includes("cto") || t.includes("cio") || t.includes("coo") || t.includes("chief")) return "Executive";
  if (t.includes("engineer") || t.includes("developer") || t.includes("architect") || t.includes("technical")) return "IT";
  if (t.includes("finance") || t.includes("accounting") || t.includes("treasurer")) return "Finance";
  if (t.includes("marketing") || t.includes("brand") || t.includes("communications")) return "Marketing";
  if (t.includes("sales") || t.includes("business development") || t.includes("account")) return "Sales";
  if (t.includes("operations") || t.includes("supply chain") || t.includes("logistics")) return "Operations";
  if (t.includes("human") || t.includes("people") || t.includes("talent") || t.includes("hr")) return "HR";
  if (t.includes("legal") || t.includes("compliance") || t.includes("counsel")) return "Legal";
  if (t.includes("product") || t.includes("design")) return "Product";
  if (t.includes("data") || t.includes("analytics") || t.includes("intelligence")) return "Data & Analytics";
  return "Other";
}

function generateEmailGuess(firstName: string, lastName: string, domain: string): string {
  const f = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const l = lastName.toLowerCase().replace(/[^a-z]/g, "");
  if (!f || !l) return "";
  return `${f}.${l}@${domain}`;
}

function extractDomain(companyName: string, websiteUrl?: string): string {
  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
      return url.hostname.replace(/^www\./, "");
    } catch {}
  }
  return `${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
}

export async function searchOrganization(companyName: string): Promise<ApolloOrganization | null> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const response = await fetch(`${APOLLO_API_BASE}/mixed_companies/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        q_organization_name: companyName,
        page: 1,
        per_page: 5,
      }),
    });

    const data = await response.json();
    
    if (!response.ok || data.error) {
      console.warn(`Apollo org search unavailable: ${data.error || response.statusText}. Contacts will be generated using AI sources.`);
      return null;
    }

    const organizations = data.organizations || data.accounts || [];
    if (organizations.length === 0) return null;

    const match = organizations.find(
      (org: ApolloOrganization) =>
        org.name.toLowerCase() === companyName.toLowerCase()
    ) || organizations[0];

    console.log(`Apollo: Found organization "${match.name}" (ID: ${match.id})`);
    return match;
  } catch (err) {
    console.error("Apollo org search error:", err);
    return null;
  }
}

export async function searchPeopleByOrganization(
  organizationId: string,
  companyName: string,
  websiteUrl?: string,
  options?: {
    perPage?: number;
    page?: number;
    personTitles?: string[];
    personSeniorities?: string[];
    excludeNames?: string[];
  }
): Promise<ApolloContact[]> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return [];
    const perPage = options?.perPage || 25;
    const page = options?.page || 1;

    const body: Record<string, any> = {
      organization_ids: [organizationId],
      page,
      per_page: perPage,
    };

    if (options?.personTitles && options.personTitles.length > 0) {
      body.person_titles = options.personTitles;
    }

    if (options?.personSeniorities && options.personSeniorities.length > 0) {
      body.person_seniorities = options.personSeniorities;
    }

    const response = await fetch(`${APOLLO_API_BASE}/mixed_people/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.warn(`Apollo people search unavailable: ${data.error || response.statusText}. Using AI sources instead.`);
      return [];
    }

    const people: ApolloPerson[] = data.people || [];

    if (people.length === 0) {
      console.log(`Apollo: No people found for org ${organizationId}`);
      return [];
    }

    const domain = extractDomain(companyName, websiteUrl);
    const excludeNamesLower = (options?.excludeNames || []).map((n) => n.toLowerCase());

    const contacts: ApolloContact[] = people
      .filter((p) => {
        if (!p.name || !p.title) return false;
        if (excludeNamesLower.includes(p.name.toLowerCase())) return false;
        return true;
      })
      .map((p) => {
        const linkedinUrl = p.linkedin_url ||
          `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(p.name + " " + companyName)}`;

        return {
          name: p.name,
          title: p.title,
          department: mapDepartment(p.departments, p.title),
          email: generateEmailGuess(p.first_name, p.last_name, domain),
          linkedin: linkedinUrl,
          source: "Apollo.io",
          sourceUrl: linkedinUrl,
          relevance: `${p.seniority || "Professional"} level contact at ${companyName}${p.departments && p.departments.length > 0 ? ` in ${p.departments[0].replace(/_/g, " ")}` : ""} - sourced from Apollo.io database`,
        };
      });

    console.log(`Apollo: Found ${contacts.length} people for "${companyName}"`);
    return contacts;
  } catch (err) {
    console.error("Apollo people search error:", err);
    return [];
  }
}

export async function searchApolloContacts(
  companyName: string,
  websiteUrl?: string,
  options?: {
    maxContacts?: number;
    excludeNames?: string[];
    seniorityFocus?: "executive" | "all";
  }
): Promise<ApolloContact[]> {
  const org = await searchOrganization(companyName);
  if (!org) {
    console.log(`Apollo: Could not find organization "${companyName}", skipping Apollo source`);
    return [];
  }

  const maxContacts = options?.maxContacts || 15;
  const excludeNames = options?.excludeNames || [];

  const seniorities = options?.seniorityFocus === "executive"
    ? ["c_suite", "vp", "director"]
    : ["c_suite", "vp", "director", "manager", "senior"];

  const contacts = await searchPeopleByOrganization(
    org.id,
    companyName,
    websiteUrl || org.website_url,
    {
      perPage: Math.min(maxContacts + 10, 100),
      personSeniorities: seniorities,
      excludeNames,
    }
  );

  return contacts.slice(0, maxContacts);
}

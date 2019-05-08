import fetch from "node-fetch";
import { shopifyApi } from "../credentials/shopify-credentials";

const shopifyFetch = (method: "GET" | "POST" | "PUT" | "DELETE") => async (path: string, body?: object) => {
  const headers = {
    "Content-Type": "application/json",
    Authorization:
      "Basic " + Buffer.from("8cbeee2ebd4fc34f489e2bc503bd001a:06d008071540fb1d2d43805a69e0a4b9").toString("base64")
  };
  const url = `${shopifyApi}/${path}`;
  const bodyOption = body ? { body: JSON.stringify(body) } : {};
  const response = await fetch(url, { headers, ...bodyOption, method });
  if (!response.ok) {
    throw Error(response.statusText);
  }
  if (method === "DELETE") {
    return await response.text();
  } else {
    return await response.json();
  }
};

const shopifyGet = shopifyFetch("GET");
const shopifyPost = shopifyFetch("POST");
const shopifyPut = shopifyFetch("PUT");
// const shopifyDelete = shopifyFetch("DELETE");

interface IShopifyCustomer {
  id: number;
  email: string;
}

interface IShopifyPriceRule {
  id: number;
  prerequisite_customer_ids: number[];
  title: string;
}

interface IDiscountCode {
  id: number;
  price_rule_id: number;
  code: string;
}

const getCustomerByEmail = async (email: string): Promise<IShopifyCustomer | undefined> => {
  const result: { customers: IShopifyCustomer[] } = await shopifyGet(`customers/search.json?query=email:${email}`);
  return result.customers.length < 1 ? undefined : result.customers[0];
};

const findPriceRuleByTitle = async (code: string): Promise<IShopifyPriceRule | undefined> => {
  const result: { price_rules: IShopifyPriceRule[] } = await shopifyGet(`price_rules.json`);
  const filteredPriceRules = result.price_rules.filter(({ title }) => title === code);
  if (filteredPriceRules.length < 1) return undefined;
  return filteredPriceRules[0];
};

export async function addCouponCodeToPriceRule(title: string, code: string): Promise<IDiscountCode | undefined> {
  const priceRule = await findPriceRuleByTitle(title);
  if (!priceRule) throw new Error(`price rule ${title} not found`);

  const { discount_code }: { discount_code: IDiscountCode } = await shopifyPost(
    `price_rules/${priceRule.id}/discount_codes.json`,
    {
      discount_code: { code }
    }
  );
  return discount_code;
}

export async function addUserToDiscount(email: string, title: string) {
  const customer = await getCustomerByEmail(email);
  if (!customer) throw new Error(`customer ${email} not found`);

  const priceRule = await findPriceRuleByTitle(title);
  if (!priceRule) throw new Error(`price rule ${title} not found`);

  const customerIds = priceRule.prerequisite_customer_ids;
  if (!customerIds.includes(customer.id)) {
    const price_rule_update = {
      id: priceRule.id,
      prerequisite_customer_ids: [...priceRule.prerequisite_customer_ids, customer.id]
    };
    await shopifyPut(`price_rules/${priceRule.id}.json`, { price_rule: price_rule_update });
  }
  return undefined;
}

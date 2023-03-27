import Scraper from "./scraper"; 
import * as dotenv from "dotenv"; 
import { logger } from "./logger"; 

dotenv.config();

(async () => {
  const conversationID: string | undefined = process.env.CONVERSATION_ID;
  const twitterBearer: string | undefined = process.env.TWITTER_BEARER;
  const numTokens: number = Number(process.env.NUM_TOKENS) ?? 0;
  const rpcProvider: string | undefined = process.env.RPC_PROVIDER;

  if (!conversationID || !twitterBearer) {
    logger.error("Missing required parameters, update .env");
    process.exit(1);
  }

  const scraper = new Scraper(
    conversationID,
    twitterBearer,
    numTokens,
    rpcProvider
  );
  await scraper.scrape();
})();

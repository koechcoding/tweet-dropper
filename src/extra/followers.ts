import fs from "fs"; 
import axios from "axios"; 
import * as dotenv from "dotenv"; 
import { logger } from "../logger"; 

dotenv.config();

type User = {
  id: string;
  name: string;
  handle: string;
  description: string;
  followers_count: number;
  following_count: number;
  verified: boolean;
  created_at: string;
};

export default class Scraper {
  twitterBearer: string;
  twitterHandle: string;
  ids: string[] = [];
  users: User[] = [];

 
  constructor(twitterBearer: string, twitterHandle: string) {
    this.twitterBearer = twitterBearer;
    this.twitterHandle = twitterHandle;
  }

  
  generateFollowersEndpoint(nextToken?: string): string {
    const baseEndpoint: string =
      "https://api.twitter.com/1.1/followers/ids.json?screen_name=" +
      this.twitterHandle +
      "&stringify_ids=true";

    return nextToken ? `${baseEndpoint}&cursor=${nextToken}` : baseEndpoint;
  }

  
  async collectAllFollowers(nextFollowerEndpoint?: string): Promise<void> {
    const { data } = await axios({
      method: "GET",
      url: this.generateFollowersEndpoint(nextFollowerEndpoint),
      headers: {
        Authorization: `Bearer ${this.twitterBearer}`
      }
    });

    
    const ids: string[] = data.ids;
    this.ids.push(...ids);
    logger.info(`Collected ${ids.length} followers`);

    const nextCursor: string = data.next_cursor_str;
    if (nextCursor !== "0" && this.ids.length < 15000) {
      await this.collectAllFollowers(nextCursor);
    }
  }

  
  
  chunk<T>(array: T[], chunkSize: number): T[][] {
    const results = [];

    for (let i = 0, len = array.length; i < len; i += chunkSize) {
      results.push(array.slice(i, i + chunkSize));
    }

    return results;
  }

  
  async collectAllUsers(): Promise<void> {
    const chunked_ids: string[][] = this.chunk(this.ids, 100);

    for (let i = 0; i < chunked_ids.length; i++) {
      const batchIdsStr: string = chunked_ids[i].join(",");

      const { data } = await axios({
        method: "POST",
        url: `https://api.twitter.com/1.1/users/lookup.json?user_id=${batchIdsStr}&include_entities=false`,
        headers: {
          Authorization: `Bearer ${this.twitterBearer}`
        }
      });

      for (let j = 0; j < data.length; j++) {
        const user = data[j]; 

        this.users.push({
          id: user.id_str,
          name: user.name,
          handle: user.screen_name,
          description: user.description,
          followers_count: user.followers_count,
          following_count: user.friends_count,
          verified: user.verified,
          created_at: user.created_at
        });
      }

      logger.info(`Total collected users: ${this.users.length}`);
    }
  }

  
  async scrape(): Promise<void> {
    await this.collectAllFollowers();
    logger.info(
      `Collected ${this.ids.length} follower ids. Now collecting details.`
    );
    await fs.writeFileSync("follower-ids.json", JSON.stringify(this.ids));

    await this.collectAllUsers();
    logger.info(`Collected ${this.users.length} followers`);
    await fs.writeFileSync("follower-details.json", JSON.stringify(this.users));
  }
}

(async () => {
  const twitterBearer: string | undefined = process.env.TWITTER_BEARER;
  const twitterHandle: string | undefined = process.env.TWITTER_USER;


  if (!twitterBearer || !twitterHandle) {
    logger.error("Missing required parameters, update .env");
    process.exit(1);
  }


  const scraper = new Scraper(twitterBearer, twitterHandle);
  await scraper.scrape();
})();

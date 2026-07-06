import { defineCollection } from "astro:content";
import { payloadCollectionLoader, payloadSdkAdapter } from "@avovix/astro-loader-payload";
import type { Config } from 'astro-payload-with-sdk-cms'
import { PayloadSDK } from '@payloadcms/sdk'


const baseURL = import.meta.env.PAYLOAD_BASE_URL;
if (!baseURL) throw new Error('PAYLOAD_BASE_URL is not set');

const sdk = new PayloadSDK<Config>({
    baseURL: baseURL,
})


const posts = defineCollection({
    loader: payloadCollectionLoader({
        adapter: payloadSdkAdapter(sdk),
        collectionSlug: 'posts', 
        skipValidation: true
    })
})

export const collections = { 
    posts 
}
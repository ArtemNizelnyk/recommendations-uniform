# Uniform Component Starter Kit

This is the latest version of the Uniform Component Starter Kit (CSK) - version 6, built specifically for Next.js 15 App Router leveraging React 19, TailwindCSS and TypeScript.

> If you are looking for the Next.js Page Router version, check out this older [repo](https://github.com/uniformdev/uniform-component-starter-kit) instead.


## Prerequisites

- A Uniform account with the ability to create a new empty project. If you don't have a Uniform account, you can request a trial account [here](https://uniform.dev/try).
- Node.js LTS and `git` installed on your machine.

## Getting started

### Step 1. Initial setup

1. `git clone` this repo.
2. Create an empty Uniform project in your team.
3. Setup your .env file using your Uniform project connection details (see .env.example for reference)
   ```bash
   UNIFORM_PROJECT_ID=
   UNIFORM_API_KEY=
   UNIFORM_PREVIEW_SECRET=hello-world
   ```
   > Make sure your API key has "Developer" role to be able to push content.
4. `npm install` to install dependencies
5. Create a data source based on `HTTP Request` with publicId: `uniformCanvas` that uses `https://uniform.global` as url and passes an `x-api-key` header with your actual api key token as a value.
6. Run `npm run push` to initialize your project.
   > This will push all content from disk (`.\content` folder) and your design settings (colors, fonts, borders, etc. for this default theme).

### Step 2. Run locally in dev mode

Use `npm run dev` to run locally.
At this point, you should be able to browse your site on `http://localhost:3000` and open the Home composition in your Uniform project to start visual editing your content.

### Step 3. Install the Design Extensions integration

This integration brings new parameter types for design and layout control via Uniform UI extensions to help control and manage the look and feel of your components.

1. Open your project.
   ![Your project](https://res.cloudinary.com/uniform-demos/image/upload/csk-v-next/doc/project_page.png)
1. Navigate to the `Integrations` tab, find the `Design Extensions` integration and install it.

## How to sync content

The following scripts are created to facilitate sync of content between the `./content` folder and your project.

1. Run `npm run push:content` to push data from disk (see `./content`) to your Uniformproject.
1. Run `npm run pull:content` to pull data from your Uniform project to `./content` folder.

Alternatively you can use `npm run pull:content:dev` and `npm run push:content:dev` to pull and push developer-owned content to your local project. The scope of the developer-owned content is defined in the `uniform.config.dev.ts` file.

> Developer-owned content typically scoped to components, content types, component patterns but can vary based on the stage of your project lifecycle and your preferences. For example, at some point, you may not want to sync assets like images, videos, etc.


# Uniform Recommendations Implementation

This project demonstrates three different approaches to implementing personalized recommendations using Uniform DXP. Each approach has its own advantages and use cases, providing flexibility in how you deliver personalized content to your users.

## Overview

This application showcases three distinct methods for implementing recommendations:

1. **Search-based Recommendations**
2. **Personalization with Composition Data**
3. **Personalization with Entry Data**

Each approach leverages Uniform's capabilities in different ways, from direct API calls to composition transformations.

## Approaches to Recommendations

### 1. Search-based Recommendations

This approach uses direct API calls to fetch and filter recommendations based on user signals and enrichments.

**Key Components:**
- `Recommendations.tsx`: Client-side component that fetches recommendations based on user signals
- `Deal.tsx`: Displays individual deal cards with brand information
- `api/recommendations/route.ts`: Server-side API endpoint that queries Uniform CMS
- `EnrichmentScoreComponent.tsx`: Tracks user interactions to build user profiles

**How it works:**
1. The `Recommendations` component extracts user signals from localStorage (ufvisitor)
2. It identifies the user type (American, Spanish, or Everyone) based on session scores
3. It collects brand enrichments from the user's profile
4. It makes a POST request to the `/api/recommendations` endpoint with user type and enrichments
5. The API endpoint uses these parameters to query Uniform CMS with appropriate sorting
6. Results are displayed as deal cards with pagination

**Advantages:**
- Real-time filtering and sorting based on the latest user data
- Direct control over the recommendation algorithm
- Ability to implement complex sorting logic on the server

### 2. Personalization with Composition Data

This approach transforms compositions on the server to wrap deals in personalization components based on brand data.

**Key Components:**
- `transformRecommendations.ts`: Server-side utility that transforms compositions
- `Deal.tsx`: Component that resolves brand data from composition or API
- `DealGrid.tsx`: Container for displaying multiple deals
- `RecommendationsList.tsx`: Component that displays personalized recommendations
- `brandCriteria.ts`: Utilities for handling brand criteria
- `page.tsx`: Page component that applies transformations

**How it works:**
1. When a page loads, `page.tsx` checks if it contains a `recommendationsList` component
2. If found, it applies the `transformRecommendationsInComposition` transformation
3. This transformation:
   - Finds deals in the composition
   - Extracts brand IDs from each deal's composition data
   - Fetches brand names from the CMS
   - Creates personalization criteria for each deal based on brand names
   - Wraps deals in a personalization component with these criteria
4. The `Deal` component then resolves brand data either from direct references or by making API calls

**Advantages:**
- Server-side transformation means personalization logic runs before the page is sent to the client
- Reuses existing composition data without requiring additional API calls
- Maintains a clean separation between content structure and personalization logic

### 3. Personalization with Entry Data

This approach uses pre-provided entry data to create personalized recommendations without additional API calls.

**Key Components:**
- `RecommendationCompositionEntry.tsx`: Component for displaying recommendations with entry data
- `transformRecommendationsForEntry.ts`: Server-side transformation for entry-based recommendations
- `DealForEntry.tsx`: Component that renders deals using pre-provided brand data

**How it works:**
1. When a page loads, `page.tsx` checks if it contains a `recommendationsListWithEntry` component
2. If found, it applies the `transformRecommendationsForEntry` transformation
3. This transformation:
   - Finds deals in the composition
   - Extracts brand names directly from the pre-provided entry data
   - Creates personalization criteria based on these brand names
   - Wraps deals in a personalization component with these criteria
4. The `DealForEntry` component renders deals using the brand data that's already included in the composition

**Advantages:**
- No additional API calls needed to resolve brand data
- Faster rendering as all data is available immediately
- Simplified component implementation with direct access to all required data

## Choosing the Right Approach

- **Use Search-based** when you need real-time filtering and complex sorting logic
- **Use Composition Data** when you want to leverage existing composition structures with dynamic brand resolution
- **Use Entry Data** when performance is critical and you can pre-provide all necessary data

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up your Uniform project and configure environment variables
4. Run the development server with `npm run dev`
5. Explore the different recommendation approaches at:
   - `/recomendations` for search-based recommendations
   - `/composition-recommendations` for composition-based recommendations
   - `/composition-entry-recommendations` for entry-based recommendations

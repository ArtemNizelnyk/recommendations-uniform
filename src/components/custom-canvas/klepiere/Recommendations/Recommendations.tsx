'use client';

import { FC } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { ComponentProps } from '@uniformdev/canvas-next-rsc/component';
import { AudienceType, AMERICAN, SPANISH, EVERYONE, AUDIENCE_ICONS } from '@/constants/index';
import { Deal } from '@/types/index';
import { BrandEnrichment, getBrandEnrichments } from '@/utils';

// Here, you can add parameters to be used on the canvas side.
export type RecommendationsComponentParameters = {
  dealsPerPage?: number;
};

type RecommendationsComponentProps = ComponentProps<RecommendationsComponentParameters>;

const deals_PER_PAGE: number = 3 as const;

const AUDIENCE_BG_COLORS: Record<AudienceType, string> = {
  americansignal: 'bg-[#166434]',
  spanishsignal: 'bg-[#3730A3]',
  everyone: 'bg-[#991B1B]',
};

const getBgColor = (audience: AudienceType): string => AUDIENCE_BG_COLORS[audience] || 'bg-gray-200';

const getMostCommonAudienceColor = (deals: Deal[]): string => {
  const audienceCounts = deals.reduce(
    (acc, deal) => {
      const audience = deal.audienceType as AudienceType;

      if (audience in acc) {
        acc[audience] += 1;
      }

      return acc;
    },
    { americansignal: 0, spanishsignal: 0, everyone: 0 } as Record<AudienceType, number>
  );

  // Find the audience with the maximum count
  const mostCommonAudience = Object.entries(audienceCounts).reduce((a, b) => (a[1] > b[1] ? a : b))[0] as AudienceType;

  return getBgColor(mostCommonAudience);
};

const Recommendations: FC<RecommendationsComponentProps> = ({ dealsPerPage = deals_PER_PAGE }) => {
  const [alldeals, setAlldeals] = useState<Deal[]>([]);
  const [displayeddeals, setDisplayeddeals] = useState<Deal[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPageColor, setCurrentPageColor] = useState<string>('bg-indigo-600');
  const [userType, setUserType] = useState<string | undefined>(undefined);
  const [enrichments, setEnrichments] = useState<BrandEnrichment[]>([]);

  const updateDisplayeddeals = useCallback(
    (deals: Deal[], page: number) => {
      const startIndex = (page - 1) * Number(dealsPerPage);
      const endIndex = startIndex + Number(dealsPerPage);
      const newDisplayeddeals = deals.slice(startIndex, endIndex);
      setDisplayeddeals(newDisplayeddeals);
      setCurrentPage(page);
      setCurrentPageColor(getMostCommonAudienceColor(newDisplayeddeals));
    },
    [dealsPerPage]
  );

  // Determine userType from localStorage (ufvisitor)
  useEffect(() => {
    try {
      const rawData = typeof window !== 'undefined' ? localStorage.getItem('ufvisitor') : null;

      if (rawData) {
        const parsedData = JSON.parse(rawData);
        const scores = parsedData?.visitorData?.sessionScores || {};
        const enrichments = getBrandEnrichments(parsedData?.visitorData?.scores || {});
        setEnrichments(enrichments);

        const americanScore = scores[`${AMERICAN}`] || 0;
        const spanishScore = scores[`${SPANISH}`] || 0;

        let resolvedUserType: AudienceType = EVERYONE;

        if (americanScore > spanishScore) {
          resolvedUserType = AMERICAN;
        } else if (spanishScore > americanScore) {
          resolvedUserType = SPANISH;
        }
        // If scores are equal or both are zero, it remains EVERYONE
        setUserType(resolvedUserType);
      } else {
        // If no local storage data is found, fallback to 'everyone'
        setUserType(EVERYONE);
      }
    } catch (error) {
      console.error('Error parsing ufvisitor data:', error);
      setUserType(EVERYONE);
    }
  }, []);

  // Fetch data only after we have a stable userType
  useEffect(() => {
    const fetchData = async () => {
      if (!userType) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userType, enrichments }),
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setAlldeals(result || []);
        updateDisplayeddeals(result || [], 1);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setAlldeals([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [updateDisplayeddeals, userType, enrichments]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateDisplayeddeals(alldeals, newPage);
    },
    [alldeals, updateDisplayeddeals]
  );

  if (isLoading)
    return (
      <div className="flex items-center justify-center bg-white py-16">
        <div className="text-center">
          <svg
            className="inline size-16 animate-spin text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading awesome deals...</h2>
          <p className="mt-2 text-gray-500">Get ready for some great recommendations!</p>
        </div>
      </div>
    );

  const totalPages = Math.ceil(alldeals.length / dealsPerPage);

  return (
    <div className="bg-white px-4 py-16 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-center text-4xl font-bold text-gray-900 md:text-5xl lg:text-5xl">Recommended deals</h1>

        <div className="mb-8 flex justify-center gap-4">
          <button
            onClick={() => (window.location.href = `${window.location.pathname}?country=usa`)}
            className="inline-flex items-center rounded-md bg-[#166434] px-4 py-2 text-white hover:bg-[#145c2f]"
          >
            {AUDIENCE_ICONS.americansignal} <span className="ml-2">Im American</span>
          </button>
          <button
            onClick={() => (window.location.href = `${window.location.pathname}?country=spain`)}
            className="inline-flex items-center rounded-md bg-[#3730A3] px-4 py-2 text-white hover:bg-[#312b8a]"
          >
            {AUDIENCE_ICONS.spanishsignal} <span className="ml-2">Im Spanish</span>
          </button>
          <button
            onClick={() => (window.location.href = window.location.pathname)}
            className="inline-flex items-center rounded-md bg-[#991B1B] px-4 py-2 text-white hover:bg-[#831818]"
          >
            {AUDIENCE_ICONS.everyone} <span className="ml-2">Forget Me</span>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayeddeals.map((deal, index) => (
            <div key={index} className="flex h-96 flex-col overflow-hidden bg-white shadow-lg">
              <div className={`h-2 ${getBgColor(deal.audienceType)}`}></div>
              <div className="flex grow flex-col p-6">
                {deal.logo && (
                  <div className="mb-4 h-32">
                    <img src={deal.logo} alt={deal.name} className="size-full object-contain" />
                  </div>
                )}
                <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-indigo-600">
                  {deal.audience}
                </div>
                <div className="mb-4 flex-1 overflow-y-auto">
                  <a href={deal.url} title={deal.name}>
                    <h2 className="mb-2 text-xl font-bold text-gray-900">{deal.name}</h2>
                  </a>
                </div>

                <div className="text-sm text-gray-500">
                  <span className="font-medium">Brands:</span>
                  <ul className="list-inside">
                    {deal.brands.map((brand, brandIndex) => (
                      <li key={brandIndex} className="flex items-center gap-2">
                        <span>{brand.name}</span>
                        <img src={brand.logo} alt={brand.name} className="size-8" />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="inline-flex border border-gray-300 shadow">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`px-4 py-2 text-sm font-medium ${
                    page === currentPage ? `${currentPageColor} text-white` : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border-r border-gray-300 last:border-r-0`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recommendations;

import { Helmet } from 'react-helmet-async';

interface PageSEOProps {
    title: string;
    description?: string;
    image?: string;
    url?: string;
}

export function PageSEO({ title, description, image, url }: PageSEOProps) {
    const fullTitle = `${title} | VOXERA 2026`;
    const defaultDescription = 'VOXERA 2026 — A Literary Fiesta by JB Language Club at JBIET. March 16–18, 2026.';
    const desc = description || defaultDescription;
    const defaultImage = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80';

    return (
        <Helmet>
            <title>{fullTitle} </title>
            <meta name="description" content={desc} />

            {/* Open Graph */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={desc} />
            <meta property="og:image" content={image || defaultImage
            } />
            {url && <meta property="og:url" content={url} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={image || defaultImage} />
        </Helmet>
    );
}

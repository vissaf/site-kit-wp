/**
 * WPDashboardPopularPages component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import cloneDeep from 'lodash/cloneDeep';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	MODULES_ANALYTICS,
	DATE_RANGE_OFFSET,
} from '../../modules/analytics/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import PreviewTable from '../../components/PreviewTable';
import TableOverflowContainer from '../../components/TableOverflowContainer';
import ReportTable from '../ReportTable';
import DetailsPermaLinks from '../DetailsPermaLinks';
import { numFmt } from '../../util';
import { isFeatureEnabled } from '../../features';
const { useSelect, useInViewSelect } = Data;

export default function WPDashboardPopularPages( props ) {
	const { WidgetReportZero, WidgetReportError } = props;

	const zeroDataStatesEnabled = isFeatureEnabled( 'zeroDataStates' );

	const isGatheringData = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).isGatheringData()
	);

	const dateRangeDates = useSelect( ( select ) =>
		select( CORE_USER ).getDateRangeDates( {
			compare: true,
			offsetDays: DATE_RANGE_OFFSET,
		} )
	);

	const reportArgs = {
		...dateRangeDates,
		metrics: [
			{
				expression: 'ga:pageviews',
				alias: 'Pageviews',
			},
		],
		dimensions: [ 'ga:pagePath' ],
		orderby: [
			{
				fieldName: 'ga:pageviews',
				sortOrder: 'DESCENDING',
			},
		],
		limit: 5,
	};

	const report = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getReport( reportArgs )
	);

	const titles = useInViewSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPageTitles( report, reportArgs )
	);

	const error = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getErrorForSelector( 'getReport', [
			reportArgs,
		] )
	);

	const loading = useSelect( ( select ) => {
		const reportLoaded = select(
			MODULES_ANALYTICS
		).hasFinishedResolution( 'getReport', [ reportArgs ] );

		const hasLoadedPageTitles = undefined !== error || undefined !== titles;

		return ! hasLoadedPageTitles || ! reportLoaded;
	} );

	if ( loading || isGatheringData === undefined ) {
		return <PreviewTable rows={ 6 } />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isGatheringData && ! zeroDataStatesEnabled ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	// data.rows is not guaranteed to be set so we need a fallback.
	const rows = cloneDeep( report[ 0 ].data.rows ) || [];
	// Combine the titles from the pageTitles with the rows from the metrics report.
	rows.forEach( ( row ) => {
		const url = row.dimensions[ 0 ];
		row.dimensions.unshift( titles[ url ] ); // We always have an entry for titles[url].
	} );

	return (
		<div className="googlesitekit-search-console-widget">
			<h2 className="googlesitekit-search-console-widget__title">
				{ __( 'Top content over the last 28 days', 'google-site-kit' ) }
			</h2>
			<TableOverflowContainer>
				<ReportTable
					rows={ rows }
					columns={ tableColumns }
					limit={ 5 }
					gatheringData={ isGatheringData }
				/>
			</TableOverflowContainer>
		</div>
	);
}

const tableColumns = [
	{
		title: __( 'Title', 'google-site-kit' ),
		description: __( 'Page Title', 'google-site-kit' ),
		primary: true,
		Component: ( { row } ) => {
			const [ title, path ] = row.dimensions;
			return <DetailsPermaLinks title={ title } path={ path } />;
		},
	},
	{
		title: __( 'Pageviews', 'google-site-kit' ),
		description: __( 'Pageviews', 'google-site-kit' ),
		field: 'metrics.0.values.0',
		Component: ( { fieldValue } ) => (
			<span>{ numFmt( fieldValue, { style: 'decimal' } ) }</span>
		),
	},
];

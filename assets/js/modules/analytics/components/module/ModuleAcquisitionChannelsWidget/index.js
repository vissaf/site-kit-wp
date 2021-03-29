/**
 * ModuleAcquisitionChannelsWidget component.
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
 * WordPress dependencies
 */
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS, STORE_NAME } from '../../../datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import PreviewTable from '../../../../../components/PreviewTable';
import SourceLink from '../../../../../components/SourceLink';
import { isZeroReport, trafficSourcesReportDataDefaults } from '../../../util';
import TableOverflowContainer from '../../../../../components/TableOverflowContainer';
import ReportTable from '../../../../../components/ReportTable';
import { getCurrentDateRangeDayCount } from '../../../../../util/date-range';
import WidgetHeader from '../../common/WidgetHeader';
import PieChart from './PieChart';
import { numFmt } from '../../../../../util';
import MiniChart from '../../../../../components/MiniChart';

const { useSelect } = Data;

export default function ModuleAcquisitionChannelsWidget( { Widget, WidgetReportZero, WidgetReportError } ) {
	const reportType = 'trafficsources-overview';

	const {
		hasFinishedResolution,
		dateRange,
		report,
		error,
		url,
	} = useSelect( ( select ) => {
		const reportDateRange = select( CORE_USER ).getDateRange();
		const reportArgs = {
			...trafficSourcesReportDataDefaults,
			dateRange: reportDateRange,
		};

		return {
			dateRange: reportDateRange,
			error: select( STORE_NAME ).getErrorForSelector( 'getReport', [ reportArgs ] ),
			hasFinishedResolution: select( STORE_NAME ).hasFinishedResolution( 'getReport', [ reportArgs ] ),
			report: select( STORE_NAME ).getReport( reportArgs ),
			url: select( MODULES_ANALYTICS ).getServiceReportURL( reportType ),
		};
	} );

	if ( ! hasFinishedResolution ) {
		return <PreviewTable rows={ 4 } rowHeight={ 50 } />;
	}

	if ( error ) {
		return <WidgetReportError moduleSlug="analytics" error={ error } />;
	}

	if ( isZeroReport( report ) ) {
		return <WidgetReportZero moduleSlug="analytics" />;
	}

	const currentDayCount = getCurrentDateRangeDayCount( dateRange );
	const totalUsers = report[ 0 ].data.totals[ 0 ].values[ 1 ];
	let i;

	const tableColumns = [
		{
			title: __( 'Channel', 'google-site-kit' ),
			tooltip: __( 'Channel refers to where your traffic originated from', 'google-site-kit' ),
			primary: true,
			Component: ( { row } ) => row.dimensions[ 0 ],
		},
		{
			title: __( 'Users', 'google-site-kit' ),
			tooltip: __( 'Number of users that originated from that traffic', 'google-site-kit' ),
			field: 'metrics.0.values.0',
			Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
		},
		{
			title: __( 'New Users', 'google-site-kit' ),
			tooltip: sprintf(
				/* translators: %s: number of days */
				_n( 'Number of new users to visit your page over last %s day', 'Number of new users to visit your page over last %s days', currentDayCount, 'google-site-kit', ),
				currentDayCount,
			),
			field: 'metrics.0.values.1',
			Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
		},
		{
			title: __( 'Sessions', 'google-site-kit' ),
			tooltip: sprintf(
				/* translators: %s: number of days */
				_n( 'Number of sessions users had on your website over last %s day', 'Number of sessions users had on your website over last %s days', currentDayCount, 'google-site-kit', ),
				currentDayCount,
			),
			field: 'metrics.0.values.2',
			Component: ( { fieldValue } ) => numFmt( fieldValue, { style: 'decimal' } ),
		},
		{
			title: __( 'Percentage', 'google-site-kit' ),
			tooltip: __( 'Percentage of sessions', 'google-site-kit' ),
			field: 'metrics.0.values.1',
			Component: ( { fieldValue } ) => {
				const change = fieldValue / totalUsers;
				i = Number.isInteger( i ) ? i++ : 0;
				return (
					<Fragment key={ 'minichart-analytics-top-as-' + i }>
						<div className="googlesitekit-table__body-item-chart-wrap">
							{ numFmt( change, '%' ) }
							<MiniChart change={ change } index={ i } />
						</div>
					</Fragment>
				);
			},
		},
	];

	const title = sprintf(
		/* translators: %s: number of days */
		_n( 'Top acquisition channels over the last %s day', 'Top acquisition channels over the last %s days', currentDayCount, 'google-site-kit', ),
		currentDayCount,
	);

	return (
		<Widget
			noPadding
			Header={ () => (
				<WidgetHeader title={ title } reportType={ reportType } />
			) }
			Footer={ () => (
				<SourceLink
					className="googlesitekit-data-block__source"
					name={ _x( 'Analytics', 'Service name', 'google-site-kit' ) }
					href={ url }
					external
				/>
			) }
		>
			<div className="mdc-layout-grid">
				<div className="mdc-layout-grid__inner">
					<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-4-desktop
									mdc-layout-grid__cell--span-8-tablet
									mdc-layout-grid__cell--span-4-phone
									">
						<PieChart />
					</div>
					<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-8-desktop
									mdc-layout-grid__cell--span-8-tablet
									mdc-layout-grid__cell--span-4-phone
									">
						<TableOverflowContainer>
							<ReportTable
								rows={ report[ 0 ].data.rows }
								columns={ tableColumns }
							/>
						</TableOverflowContainer>
					</div>
				</div>
			</div>
		</Widget>
	);
}

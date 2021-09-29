/**
 * Compatibility check functions.
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

import API from 'googlesitekit-api';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { isIpInRange } from '../../../util/ip-cidr';
import {
	AMP_PROJECT_TEST_URL,
	ERROR_AMP_CDN_RESTRICTED,
	ERROR_API_UNAVAILABLE,
	ERROR_FETCH_FAIL,
	ERROR_GOOGLE_API_CONNECTION_FAIL,
	ERROR_INVALID_HOSTNAME,
	ERROR_TOKEN_MISMATCH,
	ERROR_WP_PRE_V5,
} from './constants';

const isIP = /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$/;

const invalidTlds = /\.(example|invalid|localhost|test)$/;

const invalidIpRanges = [
	{ subnet: '10.0.0.0', mask: 8 },
	{ subnet: '127.0.0.0', mask: 8 },
	{ subnet: '172.16.0.0', mask: 12 },
	{ subnet: '192.168.0.0', mask: 16 },
];
// Check for a known non-public/reserved domain.
export const checkHostname = async () => {
	const { hostname, port } = global.location;

	if ( port ) {
		throw ERROR_INVALID_HOSTNAME;
	}

	if ( isIP.test( hostname ) ) {
		for ( const { mask, subnet } of invalidIpRanges ) {
			if ( isIpInRange( hostname, subnet, mask ) ) {
				throw ERROR_INVALID_HOSTNAME;
			}
		}
	} else if ( ! hostname.includes( '.' ) || hostname.match( invalidTlds ) ) {
		throw ERROR_INVALID_HOSTNAME;
	}
};
// Check for a Site Kit specific meta tag on the page to test for aggressive caching.
export const registryCheckSetupTag = ( registry ) => async () => {
	const setupTag = await registry.dispatch( CORE_SITE ).checkForSetupTag();
	if ( setupTag.error ) {
		throw ERROR_TOKEN_MISMATCH;
	}
};
// Check that server can connect to Google's APIs via the core/site/data/health-checks endpoint.
export const checkHealthChecks = async () => {
	const response = await API.get(
		'core',
		'site',
		'health-checks',
		undefined,
		{
			useCache: false,
		}
	).catch( ( error ) => {
		if ( error.code === 'fetch_error' ) {
			throw ERROR_FETCH_FAIL;
		}
		throw ERROR_API_UNAVAILABLE;
	} );

	if ( ! response?.checks?.googleAPI?.pass ) {
		throw ERROR_GOOGLE_API_CONNECTION_FAIL;
	}
};
// Check that client can connect to AMP Project.
export const checkAMPConnectivity = async () => {
	const response = await fetch( AMP_PROJECT_TEST_URL ).catch( () => {
		throw ERROR_AMP_CDN_RESTRICTED;
	} );

	if ( ! response.ok ) {
		throw ERROR_AMP_CDN_RESTRICTED;
	}
};
// Check that the current version of WordPress is 5.0+.
export const checkWPVersion = async () => {
	const { wpVersion } = global._googlesitekitBaseData || {};
	// Throw only if we can get the current version, otherwise ignore it.
	if ( wpVersion && wpVersion.major < 5 ) {
		throw ERROR_WP_PRE_V5;
	}
};

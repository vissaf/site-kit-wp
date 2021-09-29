/**
 * IP & CIDR Utility Functions.
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

/* eslint-disable no-bitwise */

/**
 * Converts IP Address string to number.
 *
 * @since n.e.x.t
 *
 * @param {string} ip The IP Address string.
 * @return {number} The IP Address converted to number.
 *
 */
const ipNumber = ( ip ) => {
	const ipArr = ip.split( '.' );
	return (
		( +ipArr[ 0 ] << 24 ) +
		( +ipArr[ 1 ] << 16 ) +
		( +ipArr[ 2 ] << 8 ) +
		+ipArr[ 3 ]
	);
};
/**
 * Gets IP Address Mask from Mask Size.
 *
 * @since n.e.x.t
 *
 * @param {number} size Mask Size.
 * @return {number} The IP Address Mask.
 *
 */
const ipMask = ( size ) => -1 << ( 32 - size );

/**
 * Checks if a given ip is within a Subnet Range.
 *
 * @since n.e.x.t
 *
 * @param {string} ip     The IP Address.
 * @param {string} subnet The Subnet Address.
 * @param {number} mask   The Mask Size.
 * @return {boolean} Whether the ip is within the subnet range.
 */
export const isIpInRange = ( ip, subnet, mask ) =>
	( ipNumber( ip ) & ipMask( mask ) ) === ipNumber( subnet );

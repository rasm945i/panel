import React, { useState } from 'react';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerBillingRow from '@/components/billing/ServerBillingRow';
import Spinner from '@/components/elements/Spinner';
import { useStoreState } from 'easy-peasy';
import { PaginatedResult } from '@/api/http';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import useSWR from 'swr';
import Pagination from '@/components/elements/Pagination';
import tw from 'twin.macro';
import { breakpoint } from '@/theme';
import styled from 'styled-components/macro';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';

const Container = styled.div`
    ${tw`flex flex-wrap`};

    & > div {
        ${tw`w-full`};

        ${breakpoint('md')`
            width: calc(50% - 1rem);
        `}

        ${breakpoint('xl')`
            ${tw`w-auto flex-1`};
        `}
    }
`;

export default () => {
    const { search } = useLocation();
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [ page, setPage ] = useState((!isNaN(defaultPage) && defaultPage > 0) ? defaultPage : 1);
    const uuid = useStoreState(state => state.user.data!.uuid);
    const rootAdmin = useStoreState(state => state.user.data!.rootAdmin);
    const [ showOnlyAdmin, setShowOnlyAdmin ] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers } = useSWR<PaginatedResult<Server>>(
        [ '/api/client/servers', showOnlyAdmin, page ],
        () => getServers({ page, type: showOnlyAdmin ? 'admin' : undefined }),
    );

    return (
        <PageContentBlock title={'Billing Overview'}>
            {state?.twoFactorRedirect &&
            <MessageBox title={'2-Factor Required'} type={'error'}>
                Your account must have two-factor authentication enabled in order to continue.
            </MessageBox>
            }
            {rootAdmin &&
            <div css={tw`mb-2 flex justify-end items-center`}>
                <p css={tw`uppercase text-xs text-neutral-400 mr-2`}>
                    {showOnlyAdmin ? 'Showing others\' servers' : 'Showing your servers'}
                </p>
                <Switch
                    name={'show_all_servers'}
                    defaultChecked={showOnlyAdmin}
                    onChange={() => setShowOnlyAdmin(s => !s)}
                />
            </div>
            }
            {!servers ?
                <Spinner centered size={'large'}/>
                :
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) => (
                        items.length > 0 ?
                            items.map((server, index) => (
                                <ServerBillingRow
                                    key={server.uuid}
                                    server={server}
                                    css={index > 0 ? tw`mt-2` : undefined}
                                />
                            ))
                            :
                            <p css={tw`text-center text-sm text-neutral-400`}>
                                {showOnlyAdmin ?
                                    'There are no other servers to display.'
                                    :
                                    'There are no servers associated with your account.'
                                }
                            </p>
                    )}
                </Pagination>
            }
        </PageContentBlock>
    );
};
